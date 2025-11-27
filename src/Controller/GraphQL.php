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
use App\Models\Price;
use App\Models\Attribute;

use App\Resolvers\ProductResolvers;
use App\Resolvers\QueryResolvers;
use App\Resolvers\MutationResolvers;

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
                    'id' => [
                        'type' => Type::int(),
                        'resolve' => fn($attr) => $attr instanceof Attribute ? $attr->getId() : ($attr['id'] ?? null)
                    ],
                    'value' => [
                        'type' => Type::string(),
                        'resolve' => fn($attr) => $attr instanceof Attribute ? $attr->getValue() : ($attr['value'] ?? null)
                    ],
                    'displayValue' => [
                        'type' => Type::string(),
                        'resolve' => fn($attr) => $attr instanceof Attribute ? $attr->getDisplayValue() : ($attr['displayValue'] ?? null)
                    ],
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
                        'resolve' => fn($product) => ProductResolvers::resolveAttributes($product, $conn)
                    ],
                    'gallery' => [
                        'type' => Type::listOf($productGalleryType),
                        'resolve' => fn($product) => ProductResolvers::resolveGallery($product)
                    ],
                    'prices' => [
                        'type' => Type::listOf($priceType),
                        'resolve' => fn($product) => ProductResolvers::resolvePrices($product, $conn)
                    ],
                ],
            ]);

            $queryType = new ObjectType([
                'name' => 'Query',
                'fields' => [
                    'categories' => [
                        'type' => Type::listOf($categoryType),
                        'resolve' => fn() => QueryResolvers::resolveCategories()
                    ],
                    'products' => [
                        'type' => Type::listOf($productType),
                        'args' => [
                            'categoryId' => ['type' => Type::int()],
                        ],
                        'resolve' => fn($rootValue, $args) => QueryResolvers::resolveProducts($rootValue, $args, $conn)
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
                        'resolve' => fn($rootValue, $args) => MutationResolvers::resolveSum($args),
                    ],
                    'placeOrder' => [
                        'type' => $orderType,
                        'args' => [
                            'items' => Type::nonNull(Type::listOf(Type::nonNull($orderItemInputType))),
                        ],
                        'resolve' => fn($rootValue, $args) => MutationResolvers::resolvePlaceOrder($rootValue, $args, $conn)
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
