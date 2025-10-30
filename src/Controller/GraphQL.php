<?php

namespace App\Controller;

use GraphQL\GraphQL as GraphQLBase;
use GraphQL\Type\Definition\ObjectType;
use GraphQL\Type\Definition\Type;
use GraphQL\Type\Schema;
use GraphQL\Type\SchemaConfig;
use GraphQL\Error\DebugFlag;
use RuntimeException;
use Throwable;


use App\Database\Connection;
use App\Models\Product;
use App\Models\AttributeSet;

class GraphQL {
    static public function handle() {
        try {
            $db = new Connection();
            $conn = $db->connect();

            $productAttributeType = new ObjectType([
                'name' => 'Attribute',
                'fields' => [
                    'id' => Type::int(),
                    'value' => Type::string(),
                    'displayValue' => Type::string(),
                ],
            ]);

            $attributeSetType = new ObjectType([
                'name' => 'AttributeSet',
                'fields' => [
                    'id' => Type::int(),
                    'name' => Type::string(),
                    'type' => Type::string(),
                    'items' => [
                        'type' => Type::listOf($productAttributeType),
                        'resolve' => function($set) {
                            if (is_array($set) && isset($set['attributes'])) {
                                return $set['attributes'];
                            }
                            if (is_object($set) && property_exists($set, 'attributes')) {
                                return $set->attributes;
                            }
                            return [];
                        }
                    ],
                ],
            ]);

            $currencyType = new ObjectType([
                'name' => 'Currency',
                'fields' => [
                    'id' => Type::int(),
                    'label' => Type::string(),
                    'symbol' => Type::string(),
                ],
            ]);

            $priceType = new ObjectType([
                'name' => 'Price',
                'fields' => [
                    'id' => Type::int(),
                    'product_id' => Type::string(),
                    'currency_id' => Type::int(),
                    'amount' => Type::float(),
                    'currency' => [
                        'type' => $currencyType,
                        'resolve' => function($price) use ($conn) {
                            $stmt = $conn->prepare("SELECT id, label, symbol FROM currencies WHERE id = ?");
                            $stmt->bind_param("i", $price['currency_id']);
                            $stmt->execute();
                            return $stmt->get_result()->fetch_assoc();
                        }
                    ]
                ]
            ]);

            $productGalleryType = new ObjectType([
                'name' => 'ProductGallery',
                'fields' => [
                    'id' => Type::int(),
                    'product_id' => Type::string(),
                    'image_url' => Type::string(),
                ],
            ]);

            $categoryType = new ObjectType([
                'name' => 'Category',
                'fields' => [
                    'id' => Type::int(),
                    'name' => Type::string(),
                ],
            ]);

            $productType = new ObjectType([
                'name' => 'Product',
                'fields' => [
                    'id' => Type::string(),
                    'name' => Type::string(),
                    'description' => Type::string(),
                    'in_stock' => Type::boolean(),
                    'brand' => Type::string(),
                    'category_id' => Type::int(),
                    'attributes' => [
                        'type' => Type::listOf($attributeSetType),
                        'resolve' => function($product) use ($conn) {
                            $productId = is_array($product) ? $product['id'] : ($product->id ?? null);
                            if ($productId === null) return [];

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
                                $attrs = $set->getAttributes($productId);

                                $uniqueAttrs = [];
                                $seenIds = [];
                                foreach ($attrs as $attr) {
                                    $id = (int)$attr['id'];
                                    if (!isset($seenIds[$id])) {
                                        $seenIds[$id] = true;
                                        $uniqueAttrs[] = $attr;
                                    }
                                }

                                $set->attributes = $uniqueAttrs;
                                $attributeSets[] = $set;
                            }
                            $stmt->close();
                            return $attributeSets;
                        }
                    ],
                    'gallery' => [
                        'type' => Type::listOf($productGalleryType),
                        'resolve' => function($product) use ($conn) {
                            return array_map(fn($g) => [
                                'id' => $g->id,
                                'product_id' => $g->product_id,
                                'image_url' => $g->image_url
                            ], $product['gallery'] ?? []);
                        }
                    ],
                    'prices' => [
                        'type' => Type::listOf($priceType),
                        'resolve' => function($product) use ($conn) {
                            $stmt = $conn->prepare("SELECT id, product_id, amount, currency_id FROM prices WHERE product_id = ?");
                            $stmt->bind_param("s", $product['id']);
                            $stmt->execute();
                            $result = $stmt->get_result();
                            
                            $prices = [];
                            while ($row = $result->fetch_assoc()) {
                                $prices[] = [
                                    'id' => $row['id'],
                                    'product_id' => $row['product_id'],
                                    'currency_id' => $row['currency_id'],
                                    'amount' => $row['amount']
                                ];
                            }
                            $stmt->close();
                            return $prices;
                        }
                    ],
                ],
            ]);

            $queryType = new ObjectType([
                'name' => 'Query',
                'fields' => [
                    'categories' => [
                        'type' => Type::listOf($categoryType),
                        'resolve' => function() use ($conn) {
                            $res = $conn->query("SELECT id, name FROM categories");
                            $categories = [];
                            while ($row = $res->fetch_assoc()) {
                                $categories[] = $row;
                            }
                            return $categories;
                        }
                    ],
                    'products' => [
                        'type' => Type::listOf($productType),
                        'args' => [
                            'categoryId' => ['type' => Type::int()],
                        ],
                        'resolve' => function($root, $args) {
                            $categoryId = $args['categoryId'] ?? null;
                            $allProducts = Product::getAllProducts($categoryId ?: Product::CATEGORY_ALL);

                            $result = [];
                            foreach ($allProducts as $p) {
                                $result[] = [
                                    'id' => $p->id,
                                    'name' => $p->name,
                                    'description' => $p->description,
                                    'in_stock' => $p->in_stock,
                                    'brand' => $p->brand,
                                    'category_id' => $p->category_id,
                                    'gallery' => $p->gallery
                                ];
                            }
                            return $result;
                        }
                    ]
                ]
            ]);
        
            $mutationType = new ObjectType([
                'name' => 'Mutation',
                'fields' => [
                    'sum' => [
                        'type' => Type::int(),
                        'args' => [
                            'x' => ['type' => Type::int()],
                            'y' => ['type' => Type::int()],
                        ],
                        'resolve' => static fn ($calc, array $args): int => $args['x'] + $args['y'],
                    ],
                ],
            ]);
        
            // See docs on schema options:
            // https://webonyx.github.io/graphql-php/schema-definition/#configuration-options
            $schema = new Schema(
                (new SchemaConfig())
                ->setQuery($queryType)
                ->setMutation($mutationType)
            );
        
            $rawInput = file_get_contents('php://input');
            if ($rawInput === false) {
                throw new RuntimeException('Failed to get php://input');
            }
        
            $input = json_decode($rawInput, true);
            $query = $input['query'];
            $variableValues = $input['variables'] ?? null;
        
            $rootValue = ['prefix' => 'You said: '];
            $result = GraphQLBase::executeQuery($schema, $query, $rootValue, null, $variableValues);
            // $output = $result->toArray();
            $output = $result->toArray(DebugFlag::INCLUDE_DEBUG_MESSAGE | DebugFlag::INCLUDE_TRACE);
        } catch (Throwable $e) {
            $output = [
                'error' => [
                    'message' => $e->getMessage(),
                ],
            ];
        }

        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode($output);
    }
}