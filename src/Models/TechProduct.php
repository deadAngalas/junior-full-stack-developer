<?php

namespace App\Models;

class TechProduct extends Product
{
    public const CATEGORY_ID = 3;

    public function getFormattedAttributes(): array
    {
        $formatted = [];

        $formatAttr = function ($attr) {
            if (!($attr instanceof Attribute))
                return null;
            return [
                'id' => (int) ($attr->getId() ?? 0),
                'value' => $attr->getValue() ?? '',
                'displayValue' => $attr->getDisplayValue() ?? $attr->getValue(),
            ];
        };

        foreach ($this->attributes as $attrSet) {
            if (!($attrSet instanceof AttributeSet))
                continue;

            $key = $attrSet->getName();
            $items = array_filter($attrSet->getAttributes());
            $formatted[$key] = array_map($formatAttr, $items);
        }

        return $formatted;
    }
}
