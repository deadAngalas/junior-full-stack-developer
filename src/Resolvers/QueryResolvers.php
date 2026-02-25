<?php

namespace App\Resolvers;

use App\Models\Category;
use App\Models\Product;
use App\Models\TechProduct;
use App\Models\ClothesProduct;
use mysqli;

class QueryResolvers
{
    public static function resolveCategories()
    {
        return Category::getAll();
    }

    public static function resolveProducts($rootValue, array $args, mysqli $conn)
    {
        $categoryId = $args['categoryId'] ?? Product::CATEGORY_ALL;
        $allProducts = Product::getAllProducts($categoryId);

        return array_map(function ($p) {
            return [
                'id' => $p->getId(),
                'name' => $p->getName(),
                'description' => $p->getDescription(),
                'in_stock' => $p->isInStock(),
                'brand' => $p->getBrand(),
                'category_id' => $p->getCategoryId(),

                'productKind' =>
                    $p instanceof ClothesProduct ? 'clothes' :
                    ($p instanceof TechProduct ? 'tech' : 'product'),

                'formattedAttributes' => array_map(
                    fn($items, $setName) => [
                        'name' => $setName,
                        'items' => $items
                    ],
                    $p->getFormattedAttributes(),
                    array_keys($p->getFormattedAttributes())
                ),

                'gallery' => $p->getGallery(),
            ];
        }, $allProducts);
    }
}
