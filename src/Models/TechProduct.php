<?php

namespace App\Models;

class TechProduct extends Product {
    public const CATEGORY_ID = 3;

    public function __construct(
        $id = null,
        $name = null,
        $description = null,
        $in_stock = null,
        $category_id = null,
        $brand = null
    ) {
        parent::__construct($id, $name, $description, $in_stock, $category_id, $brand);
    }

    public function getFormattedAttributes(): array {
        $formatted = [];
        
        foreach ($this->attributes as $attrSet) {
            if (!($attrSet instanceof AttributeSet)) {
                continue;
            }

            $map = [
                'color' => 'colors',
            ];

            $formatAttr = function($attr) {
                if (!is_object($attr)) return null;
                $value = $attr->value ?? '';
                $display = $attr->displayValue ?? $value;
                return [
                    'id' => (int)($attr->id ?? 0),
                    'value' => $value,
                    'displayValue' => $display,
                ];
            };
        
            foreach ($this->attributes as $attrSet) {
                if (!($attrSet instanceof AttributeSet)) continue;
        
                $setName = strtolower($attrSet->name ?? '');
                $items = array_filter($attrSet->attributes ?? []);
        
                $key = $map[$setName] ?? $attrSet->name;
        
                $formatted[$key] = array_map($formatAttr, $items);
            }
        }
        
        return $formatted;
    }
}
