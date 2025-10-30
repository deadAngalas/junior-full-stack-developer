<?php

namespace App\Models;

use App\Database\Connection;
use App\Models\AttributeSet;
use App\Models\ProductGallery;

class Product {
    public $id;
    public $name;
    public $description;
    public $in_stock;
    public $category_id;
    public $brand;
    public $attributes = [];
    public $gallery = [];

    public function __construct($id = null, $name = null, $description = null, $in_stock = null, $category_id = null, $brand = null) {
        $this->id = $id;
        $this->name = $name;
        $this->description = $description;
        $this->in_stock = $in_stock;
        $this->category_id = $category_id;
        $this->brand = $brand;
    }

    public const CATEGORY_ALL = 1;
    
    public static function getAllProducts(int $category = 1): array {
        $db = (new Connection())->connect();

        $sql = "SELECT id, name, description, in_stock, category_id, brand FROM products";

        if ($category !== self::CATEGORY_ALL) {
            $sql .= " WHERE category_id = ?";
        }

        $stmt = $db->prepare($sql);

        if ($category !== self::CATEGORY_ALL) {
            $stmt->bind_param("i", $category);
        }

        $stmt->execute();
        $result = $stmt->get_result();

        $products = [];
        while ($row = $result->fetch_assoc()) {
            $prod = new self(
                $row['id'], 
                $row['name'], 
                $row['description'], 
                (bool)$row['in_stock'], 
                (int)$row['category_id'], 
                $row['brand']
            );

            $prod->loadAttributes();
            $prod->gallery = ProductGallery::getByProductId($prod->id);

            $products[] = $prod;
        }

        $stmt->close();
        $db->close();
        return $products;
    }

    public function loadAttributes() {
       try {
        $db = (new Connection())->connect();
        $stmt = $db->prepare("
            SELECT aset.id AS set_id, aset.name AS set_name, aset.type AS set_type
            FROM product_attribute_sets pas
            JOIN attribute_sets aset ON pas.attribute_set_id = aset.id
            WHERE pas.product_id = ?
        ");
        $stmt->bind_param("s", $this->id);
        $stmt->execute();
        $result = $stmt->get_result();

        while ($row = $result->fetch_assoc()) {
            $set = new AttributeSet($row['set_id'], $row['set_name'], $row['set_type']);
            $set->attributes = $set->getAttributes($this->id);
            $this->attributes[] = $set;
        }

        $stmt->close();
        $db->close();
    } catch (\Throwable $e) {
            error_log("loadAttributes error for product {$this->id}: " . $e->getMessage());
            throw $e;
        }
    }
}
?>
