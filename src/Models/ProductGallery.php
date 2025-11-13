<?php
namespace App\Models;

use App\Database\Connection;

class ProductGallery
{
    private int $id;
    private string $product_id;
    private string $image_url;

    public function __construct(int $id, string $product_id, string $image_url)
    {
        $this->id = $id;
        $this->product_id = $product_id;
        $this->image_url = $image_url;
    }

    public function getId(): int
    {
        return $this->id;
    }
    public function getProductId(): string
    {
        return $this->product_id;
    }
    public function getImageUrl(): string
    {
        return $this->image_url;
    }

    public static function getGalleryByProductId(string $productId): array
    {
        $db = (new Connection())->connect();
        $stmt = $db->prepare("SELECT id, product_id, image_url FROM product_gallery WHERE product_id = ?");
        $stmt->bind_param("s", $productId);
        $stmt->execute();
        $result = $stmt->get_result();

        $gallery = [];
        while ($row = $result->fetch_assoc()) {
            $gallery[] = new self($row['id'], $row['product_id'], $row['image_url']);
        }

        $stmt->close();
        $db->close();

        return $gallery;
    }
}