<?php
require_once __DIR__ . '/../src/Database/Connection.php';

$db = new Database();
$conn = $db->connect();

$json = file_get_contents(__DIR__ . '/data.json');
$data = json_decode($json, true);

if (!$data) {
    exit("Unable to decode JSON\n");
}

$categories = $data['data']['categories'];
$products   = $data['data']['products'];

function getOrCreateCategory($conn, string $name): int {
    $stmt = $conn->prepare("SELECT id FROM categories WHERE name = ?");
    $stmt->bind_param("s", $name);
    $stmt->execute();
    $stmt->bind_result($id);
    if ($stmt->fetch()) {
        $stmt->close();
        return $id;
    }
    $stmt->close();

    $stmt = $conn->prepare("INSERT INTO categories (name) VALUES (?)");
    $stmt->bind_param("s", $name);
    $stmt->execute();
    $insertedId = $stmt->insert_id;
    $stmt->close();

    return $insertedId;
}

function getOrCreateCurrency($conn, array $currency): int {
    $stmt = $conn->prepare("SELECT id FROM currencies WHERE label = ?");
    $stmt->bind_param("s", $currency['label']);
    $stmt->execute();
    $stmt->bind_result($id);
    if ($stmt->fetch()) {
        $stmt->close();
        return $id;
    }
    $stmt->close();

    $stmt = $conn->prepare("INSERT INTO currencies (label, symbol) VALUES (?, ?)");
    $stmt->bind_param("ss", $currency['label'], $currency['symbol']);
    $stmt->execute();
    $insertedId = $stmt->insert_id;
    $stmt->close();

    return $insertedId;
}

function getOrCreateAttributeSet($conn, string $name, string $type): int {
    $stmt = $conn->prepare("SELECT id FROM attribute_sets WHERE name = ?");
    $stmt->bind_param("s", $name);
    $stmt->execute();
    $stmt->bind_result($id);
    if ($stmt->fetch()) {
        $stmt->close();
        return $id;
    }
    $stmt->close();

    $stmt = $conn->prepare("INSERT INTO attribute_sets (name, type) VALUES (?, ?)");
    $stmt->bind_param("ss", $name, $type);
    $stmt->execute();
    $insertedId = $stmt->insert_id;
    $stmt->close();

    return $insertedId;
}

function insertAttribute($conn, int $setId, array $item) {
    $stmt = $conn->prepare("INSERT INTO attributes (attribute_set_id, display_value, value) VALUES (?, ?, ?)");
    $stmt->bind_param("iss", $setId, $item['displayValue'], $item['value']);
    $stmt->execute();
    $stmt->close();
}

foreach ($categories as $cat) {
    getOrCreateCategory($conn, $cat['name']);
}

foreach ($products as $p) {
    $categoryId = getOrCreateCategory($conn, $p['category']);

    $stmt = $conn->prepare("
        INSERT INTO products (id, name, description, in_stock, category_id, brand)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE name=VALUES(name)
    ");
    $inStock = $p['inStock'] ? 1 : 0;
    $stmt->bind_param("sssiss", $p['id'], $p['name'], $p['description'], $inStock, $categoryId, $p['brand']);
    $stmt->execute();
    $stmt->close();

    foreach ($p['gallery'] as $img) {
        $stmt = $conn->prepare("INSERT INTO product_gallery (product_id, image_url) VALUES (?, ?)");
        $stmt->bind_param("ss", $p['id'], $img);
        $stmt->execute();
        $stmt->close();
    }

    foreach ($p['prices'] as $price) {
        $currencyId = getOrCreateCurrency($conn, $price['currency']);
        $stmt = $conn->prepare("INSERT INTO prices (product_id, amount, currency_id) VALUES (?, ?, ?)");
        $stmt->bind_param("sdi", $p['id'], $price['amount'], $currencyId);
        $stmt->execute();
        $stmt->close();
    }

    foreach ($p['attributes'] as $attrSet) {
        $setId = getOrCreateAttributeSet($conn, $attrSet['name'], $attrSet['type']);

        $stmt = $conn->prepare("INSERT INTO product_attribute_sets (product_id, attribute_set_id) VALUES (?, ?)");
        $stmt->bind_param("si", $p['id'], $setId);
        $stmt->execute();
        $stmt->close();

        foreach ($attrSet['items'] as $item) {
            insertAttribute($conn, $setId, $item);
        }
    }
}
