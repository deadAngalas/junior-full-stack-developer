<?php

namespace App\Controller;

use GraphQL\GraphQL as GraphQLBase;
use GraphQL\Type\Definition\ObjectType;
use GraphQL\Type\Definition\Type;
use GraphQL\Type\Definition\InputObjectType;
use GraphQL\Type\Schema;
use GraphQL\Type\SchemaConfig;
use GraphQL\Error\DebugFlag;
use RuntimeException;
use Throwable;

use App\Database\Connection;
use App\Models\Product;
use App\Models\ClothesProduct;
use App\Models\TechProduct;
use App\Models\AttributeSet;
use App\Models\Price;
use App\Models\Category;

ini_set('display_errors', 1);
error_reporting(E_ALL);

class GraphQL
{
    public static function handle()
    {
        try {
            Product::registerType(ClothesProduct::CATEGORY_ID, ClothesProduct::class);
            Product::registerType(TechProduct::CATEGORY_ID, TechProduct::class);

            $db = new Connection();
            $conn = $db->connect();

            // type description
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
                    'id' => [
                        'type' => Type::int(),
                        'resolve' => fn($set) => $set->getId(),
                    ],
                    'name' => [
                        'type' => Type::string(),
                        'resolve' => fn($set) => $set->getName(),
                    ],
                    'type' => [
                        'type' => Type::string(),
                        'resolve' => fn($set) => $set->getType(),
                    ],
                    'items' => [
                        'type' => Type::listOf($productAttributeType),
                        'resolve' => fn($set) => $set->getAttributes(),
                    ],
                ],
            ]);

            $currencyType = new ObjectType([
                'name' => 'Currency',
                'fields' => [
                    'id' => [
                        'type' => Type::int(),
                        'resolve' => fn($currency) => $currency->getId(),
                    ],
                    'label' => [
                        'type' => Type::string(),
                        'resolve' => fn($currency) => $currency->getLabel(),
                    ],
                    'symbol' => [
                        'type' => Type::string(),
                        'resolve' => fn($currency) => $currency->getSymbol(),
                    ],
                ],
            ]);

            $priceType = new ObjectType([
                'name' => 'Price',
                'fields' => [
                    'id' => [
                        'type' => Type::int(),
                        'resolve' => fn(Price $price) => $price->getId()
                    ],
                    'product_id' => [
                        'type' => Type::string(),
                        'resolve' => fn(Price $price) => $price->getProductId()
                    ],
                    'currency_id' => [
                        'type' => Type::int(),
                        'resolve' => fn(Price $price) => $price->getCurrencyId()
                    ],
                    'amount' => [
                        'type' => Type::float(),
                        'resolve' => fn(Price $price) => $price->getAmount()
                    ],
                    'currency' => [
                        'type' => $currencyType,
                        'resolve' => fn(Price $price) => $price->getCurrency()
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

            $formattedAttributeItemType = new ObjectType([
                'name' => 'FormattedAttributeItem',
                'fields' => [
                    'id' => Type::int(),
                    'value' => Type::string(),
                    'displayValue' => Type::string(),
                ],
            ]);

            $formattedAttributeSetType = new ObjectType([
                'name' => 'FormattedAttributeSet',
                'fields' => [
                    'name' => Type::string(),
                    'items' => Type::listOf($formattedAttributeItemType),
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
                    'productKind' => Type::string(),
                    'formattedAttributes' => Type::listOf($formattedAttributeSetType),
                    'attributes' => [
                        'type' => Type::listOf($attributeSetType),
                        'resolve' => function ($product) use ($conn) {
                            $productId = is_array($product) ? ($product['id'] ?? null) : $product->getId();
                            if ($productId === null)
                                return [];

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
                                $set = new AttributeSet((int) $row['set_id'], $row['set_name'], $row['set_type']);
                                $set->loadAttributesByProductId($productId);

                                $uniqueAttrs = [];
                                $seenIds = [];
                                foreach ($set->getAttributes() as $attr) {
                                    $id = (int) $attr['id'];
                                    if (!isset($seenIds[$id])) {
                                        $seenIds[$id] = true;
                                        $uniqueAttrs[] = $attr;
                                    }
                                }
                                $set->setAttributes($uniqueAttrs);
                                $attributeSets[] = $set;
                            }
                            $stmt->close();
                            return $attributeSets;
                        }
                    ],
                    'gallery' => [
                        'type' => Type::listOf($productGalleryType),
                        'resolve' => function ($product) {
                            $gallery = is_array($product) ? ($product['gallery'] ?? []) : $product->getGallery();
                            return array_map(fn($g) => [
                                'id' => $g->getId() ?? $g->id,
                                'product_id' => $g->getProductId() ?? $g->product_id,
                                'image_url' => $g->getImageUrl() ?? $g->image_url,
                            ], $gallery);
                        }
                    ],
                    'prices' => [
                        'type' => Type::listOf($priceType),
                        'resolve' => function ($product) use ($conn) {
                            $productId = is_array($product) ? ($product['id'] ?? null) : $product->getId();
                            if ($productId === null)
                                return [];

                            $stmt = $conn->prepare("SELECT id, product_id, amount, currency_id FROM prices WHERE product_id = ?");
                            $stmt->bind_param("s", $product['id']);
                            $stmt->execute();
                            $result = $stmt->get_result();

                            $prices = [];
                            while ($row = $result->fetch_assoc()) {
                                $prices[] = new Price(
                                    (int) $row['id'],
                                    $row['product_id'],
                                    (float) $row['amount'],
                                    (int) $row['currency_id'],

                                );
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
                        'resolve' => fn() => Category::getAll()
                    ],
                    'products' => [
                        'type' => Type::listOf($productType),
                        'args' => [
                            'categoryId' => ['type' => Type::int()],
                        ],
                        'resolve' => function ($rootValue, $args) use ($conn) {
                            $categoryId = $args['categoryId'] ?? Product::CATEGORY_ALL;
                            $allProducts = Product::getAllProducts($categoryId);

                            return array_map(fn($p) => [
                                'id' => $p->getId(),
                                'name' => $p->getName(),
                                'description' => $p->getDescription(),
                                'in_stock' => $p->isInStock(),
                                'brand' => $p->getBrand(),
                                'category_id' => $p->getCategoryId(),
                                'productKind' => $p instanceof ClothesProduct ? 'clothes' : ($p instanceof TechProduct ? 'tech' : 'product'),
                                'formattedAttributes' => array_map(
                                    fn($items, $setName) => ['name' => $setName, 'items' => $items],
                                    $p->getFormattedAttributes(),
                                    array_keys($p->getFormattedAttributes())
                                ),
                                'gallery' => $p->getGallery(),
                            ], $allProducts);
                        }
                    ]
                ]
            ]);

            $orderItemInputType = new InputObjectType([
                'name' => 'OrderItemInput',
                'fields' => [
                    'product_id' => Type::nonNull(Type::string()),
                    'product_name' => Type::string(),
                    'price' => Type::float(),
                    'quantity' => Type::int(),
                    'attributes' => Type::string(),
                ],
            ]);

            $orderType = new ObjectType([
                'name' => 'Order',
                'fields' => [
                    'id' => Type::nonNull(Type::int()),
                    'total' => Type::nonNull(Type::float()),
                    'created_at' => Type::string(),
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
                        'resolve' => static fn(array $args): int => $args['x'] + $args['y'],
                    ],
                    'placeOrder' => [
                        'type' => $orderType,
                        'args' => [
                            'items' => Type::nonNull(Type::listOf(Type::nonNull($orderItemInputType))),
                        ],
                        'resolve' => function ($rootValue, $args) use ($conn) {
                            $items = $args['items'];

                            $total = 0;
                            foreach ($items as $item) {
                                $price = $item['price'] ?? 0;
                                $qty = $item['quantity'] ?? 1;
                                $total += $price * $qty;
                            }

                            $stmt = $conn->prepare("INSERT INTO orders (total) VALUES (?)");
                            $stmt->bind_param("d", $total);
                            $stmt->execute();
                            $orderId = $stmt->insert_id;
                            $stmt->close();

                            $stmt = $conn->prepare("
                            INSERT INTO order_items 
                            (order_id, product_id, product_name, price, quantity, attributes) 
                            VALUES (?, ?, ?, ?, ?, ?)
                        ");
                            foreach ($items as $item) {
                                $attributes = isset($item['attributes']) ? json_encode($item['attributes']) : null;
                                $stmt->bind_param(
                                    "issdis",
                                    $orderId,
                                    $item['product_id'],
                                    $item['product_name'],
                                    $item['price'],
                                    $item['quantity'],
                                    $attributes
                                );
                                $stmt->execute();
                            }
                            $stmt->close();

                            $stmt = $conn->prepare("SELECT * FROM orders WHERE id = ?");
                            $stmt->bind_param("i", $orderId);
                            $stmt->execute();
                            $result = $stmt->get_result()->fetch_assoc();
                            $stmt->close();

                            return $result;
                        }
                    ]
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