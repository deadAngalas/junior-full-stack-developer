<?php

namespace App\Resolvers;

use App\Models\AttributeSet;
use App\Models\Attribute;
use App\Models\Price;
use mysqli;

class ProductResolvers
{
    public static function resolveAttributes($product, mysqli $conn)
    {
        $productId = is_array($product) ? ($product['id'] ?? null) : $product->getId();
        if ($productId === null) {
            return [];
        }

        $stmt = $conn->prepare("
            SELECT aset.id AS set_id, aset.name AS set_name, aset.type AS set_type
            FROM product_attribute_sets pas
            JOIN attribute_sets aset ON pas.attribute_set_id = aset.id
            WHERE pas.product_id = ?
            GROUP BY aset.id, aset.name, aset.type
        ");
        $stmt->bind_param("s", $productId);
        $stmt->execute();
        $res = $stmt->get_result();

        $attributeSets = [];

        while ($row = $res->fetch_assoc()) {
            $set = new AttributeSet((int)$row['set_id'], $row['set_name'], $row['set_type']);
            $set->loadAttributesByProductId($productId);

            // ensure unique attributes
            $unique = [];
            $seen = [];

            foreach ($set->getAttributes() as $attr) {
                if (!($attr instanceof Attribute)) continue;
                $id = (int)$attr->getId();
                if (!isset($seen[$id])) {
                    $seen[$id] = true;
                    $unique[] = $attr;
                }
            }

            $set->setAttributes($unique);
            $attributeSets[] = $set;
        }

        $stmt->close();
        return $attributeSets;
    }

    public static function resolvePrices($product, mysqli $conn)
    {
        $productId = is_array($product) ? ($product['id'] ?? null) : $product->getId();
        if ($productId === null) {
            return [];
        }

        $stmt = $conn->prepare("SELECT id, product_id, amount, currency_id FROM prices WHERE product_id = ?");
        $stmt->bind_param("s", $productId);
        $stmt->execute();
        $result = $stmt->get_result();

        $prices = [];

        while ($row = $result->fetch_assoc()) {
            $prices[] = new Price(
                (int)$row['id'],
                $row['product_id'],
                (float)$row['amount'],
                (int)$row['currency_id']
            );
        }

        $stmt->close();
        return $prices;
    }

    public static function resolveGallery($product)
    {
        $gallery = is_array($product)
            ? ($product['gallery'] ?? [])
            : $product->getGallery();

        return array_map(fn($g) => [
            'id' => $g->getId() ?? $g->id,
            'product_id' => $g->getProductId() ?? $g->product_id,
            'image_url' => $g->getImageUrl() ?? $g->image_url,
        ], $gallery);
    }

}
