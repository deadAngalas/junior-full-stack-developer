<?php

namespace App\Models;

use App\Database\Connection;
use App\Models\AttributeSet;
use App\Models\ProductGallery;

abstract class Product
{
    private string $id;
    private string $name;
    private string $description;
    private bool $in_stock;
    private int $category_id;
    private ?string $brand;
    protected array $attributes = [];
    protected array $gallery = [];

    public const CATEGORY_ALL = 1;
    protected static array $typeMap = [];

    public function __construct(
        string $id,
        string $name,
        string $description,
        bool $in_stock,
        int $category_id,
        string $brand
    ) {
        $this->id = $id;
        $this->name = $name;
        $this->description = $description;
        $this->in_stock = $in_stock;
        $this->category_id = $category_id;
        $this->brand = $brand;
    }

    public function getId(): string
    {
        return $this->id;
    }
    public function getName(): string
    {
        return $this->name;
    }
    public function getDescription(): string
    {
        return $this->description;
    }
    public function isInStock(): bool
    {
        return $this->in_stock;
    }
    public function getCategoryId(): int
    {
        return $this->category_id;
    }
    public function getBrand(): string
    {
        return $this->brand;
    }
    public function getAttributes(): array
    {
        return $this->attributes;
    }
    public function getGallery(): array
    {
        return $this->gallery;
    }

    public static function registerType(int $categoryId, string $className): void
    {
        self::$typeMap[$categoryId] = $className;
    }

    public static function createFromRow(array $row): Product
    {
        $categoryId = (int) $row['category_id'];

        if (!isset(self::$typeMap[$categoryId])) {
            throw new \Exception("No product type registered for category {$categoryId}");
        }

        $class = self::$typeMap[$categoryId];

        return new $class(
            $row['id'],
            $row['name'],
            $row['description'],
            (bool) $row['in_stock'],
            (int) $row['category_id'],
            $row['brand']
        );
    }

    public static function getAllProducts(int $category = self::CATEGORY_ALL): array
    {
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
    
        // Берём все строки сразу
        $rows = $result->fetch_all(MYSQLI_ASSOC);
    
        $products = array_map(function($row) {
            $prod = self::createFromRow($row);
            $prod->loadAttributes();
            $prod->gallery = ProductGallery::getGalleryByProductId($prod->getId());
            return $prod;
        }, $rows);
    
        $stmt->close();
        $db->close();
    
        return $products;
    }
    

    public function loadAttributes(): void
    {
        $db = (new Connection())->connect();
        $stmt = $db->prepare("
            SELECT aset.id AS set_id, aset.name AS set_name, aset.type AS set_type
            FROM product_attribute_sets pas
            JOIN attribute_sets aset ON pas.attribute_set_id = aset.id
            WHERE pas.product_id = ?
        ");
        $id = $this->getId();
        $stmt->bind_param("s", $id);
        $stmt->execute();
        $result = $stmt->get_result();

        while ($row = $result->fetch_assoc()) {
            $set = new AttributeSet($row['set_id'], $row['set_name'], $row['set_type']);
            $set->loadAttributesByProductId($this->id);
            $this->attributes[] = $set;
        }

        $stmt->close();
        $db->close();
    }

    abstract public function getFormattedAttributes(): array;
}