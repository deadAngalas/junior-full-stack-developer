<?php
require_once __DIR__ . '/../src/Database/Connection.php';

use App\Database\Connection;

class DataImporter
{
    private $conn;
    private $data;

    public function __construct($jsonFile)
    {
        $db = new Connection();
        $this->conn = $db->connect();

        $json = file_get_contents($jsonFile);
        $this->data = json_decode($json, true);

        if (!$this->data) {
            exit("Unable to decode JSON\n");
        }
    }

    public function import()
    {
        $this->importCategories();
        $this->importProducts();
    }

    private function importCategories()
    {
        foreach ($this->data['data']['categories'] as $cat) {
            $this->getOrCreateCategory($cat['name']);
        }
    }

    private function importProducts()
    {
        $products = $this->data['data']['products'];
        foreach ($products as $p) {
            $categoryId = $this->getOrCreateCategory($p['category']);

            // Insert or update product
            $stmt = $this->conn->prepare("
                INSERT INTO products (id, name, description, in_stock, category_id, brand)
                VALUES (?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE name=VALUES(name)
            ");
            $inStock = $p['inStock'] ? 1 : 0;
            $stmt->bind_param("sssiss", $p['id'], $p['name'], $p['description'], $inStock, $categoryId, $p['brand']);
            $stmt->execute();
            $stmt->close();

            // Gallery
            foreach ($p['gallery'] as $img) {
                $stmt = $this->conn->prepare("INSERT INTO product_gallery (product_id, image_url) VALUES (?, ?)");
                $stmt->bind_param("ss", $p['id'], $img);
                $stmt->execute();
                $stmt->close();
            }

            // Prices
            foreach ($p['prices'] as $price) {
                $currencyId = $this->getOrCreateCurrency($price['currency']);
                $stmt = $this->conn->prepare("INSERT INTO prices (product_id, amount, currency_id) VALUES (?, ?, ?)");
                $stmt->bind_param("sdi", $p['id'], $price['amount'], $currencyId);
                $stmt->execute();
                $stmt->close();
            }

            // Attributes
            foreach ($p['attributes'] as $attrSet) {
                $setId = $this->getOrCreateAttributeSet($attrSet['name'], $attrSet['type']);

                $stmt = $this->conn->prepare("INSERT INTO product_attribute_sets (product_id, attribute_set_id) VALUES (?, ?)");
                $stmt->bind_param("si", $p['id'], $setId);
                $stmt->execute();
                $stmt->close();

                foreach ($attrSet['items'] as $item) {
                    $this->insertAttribute($setId, $item);
                }
            }
        }
    }

    private function getOrCreateCategory(string $name): int
    {
        $stmt = $this->conn->prepare("SELECT id FROM categories WHERE name = ?");
        $stmt->bind_param("s", $name);
        $stmt->execute();
        $stmt->bind_result($id);
        if ($stmt->fetch()) {
            $stmt->close();
            return $id;
        }
        $stmt->close();

        $stmt = $this->conn->prepare("INSERT INTO categories (name) VALUES (?)");
        $stmt->bind_param("s", $name);
        $stmt->execute();
        $insertedId = $stmt->insert_id;
        $stmt->close();

        return $insertedId;
    }

    private function getOrCreateCurrency(array $currency): int
    {
        $stmt = $this->conn->prepare("SELECT id FROM currencies WHERE label = ?");
        $stmt->bind_param("s", $currency['label']);
        $stmt->execute();
        $stmt->bind_result($id);
        if ($stmt->fetch()) {
            $stmt->close();
            return $id;
        }
        $stmt->close();

        $stmt = $this->conn->prepare("INSERT INTO currencies (label, symbol) VALUES (?, ?)");
        $stmt->bind_param("ss", $currency['label'], $currency['symbol']);
        $stmt->execute();
        $insertedId = $stmt->insert_id;
        $stmt->close();

        return $insertedId;
    }

    private function getOrCreateAttributeSet(string $name, string $type): int
    {
        $stmt = $this->conn->prepare("SELECT id FROM attribute_sets WHERE name = ?");
        $stmt->bind_param("s", $name);
        $stmt->execute();
        $stmt->bind_result($id);
        if ($stmt->fetch()) {
            $stmt->close();
            return $id;
        }
        $stmt->close();

        $stmt = $this->conn->prepare("INSERT INTO attribute_sets (name, type) VALUES (?, ?)");
        $stmt->bind_param("ss", $name, $type);
        $stmt->execute();
        $insertedId = $stmt->insert_id;
        $stmt->close();

        return $insertedId;
    }

    private function insertAttribute(int $setId, array $item)
    {
        $stmt = $this->conn->prepare("INSERT INTO attributes (attribute_set_id, display_value, value) VALUES (?, ?, ?)");
        $stmt->bind_param("iss", $setId, $item['displayValue'], $item['value']);
        $stmt->execute();
        $stmt->close();
    }
}
