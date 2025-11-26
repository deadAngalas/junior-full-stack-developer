<?php

namespace App\Resolvers;

use mysqli;

class MutationResolvers
{
    public static function resolveSum(array $args): int
    {
        return $args['x'] + $args['y'];
    }

    public static function resolvePlaceOrder($rootValue, array $args, mysqli $conn)
    {
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
}
