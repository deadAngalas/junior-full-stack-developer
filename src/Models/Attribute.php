<?php

namespace App\Models;

use App\Database\Connection;

class Attribute {
    public $id;
    public $displayValue;
    public $value;

    public function __construct($id = null, $displayValue = null, $value = null) {
        $this->id = $id;
        $this->displayValue = $displayValue;
        $this->value = $value;
    }
}
?>