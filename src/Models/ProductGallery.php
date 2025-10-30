<?php
namespace App\Models;

use App\Database\Connection;

class ProductGallery {
    public $id;
    public $product_id;
    public $image_url;

    public static function getByProductId(string $productId): array {
        $db = (new Connection())->connect();
        $stmt = $db->prepare("SELECT id, product_id, image_url FROM product_gallery WHERE product_id = ?");
        $stmt->bind_param("s", $productId);
        $stmt->execute();
        $result = $stmt->get_result();

        $images = [];
        while ($row = $result->fetch_assoc()) {
            $img = new self();
            $img->id = $row['id'];
            $img->product_id = $row['product_id'];
            $img->image_url = $row['image_url'];
            $images[] = $img;
        }

        $stmt->close();
        $db->close();
        return $images;
    }
}
?>
