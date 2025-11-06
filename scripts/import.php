<?php
require_once __DIR__ . '/DataImporter.php';

$importer = new DataImporter(__DIR__ . '/data.json');
$importer->import();
?>
