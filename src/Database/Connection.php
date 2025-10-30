<?php

namespace App\Database;

class Connection
{
    private $servername = "localhost";
    private $username = "root";
    private $password = "Root@1234"; 
    private $dbname = "scandiweb_store";

    public function connect()
    {
        $conn = new \mysqli($this->servername, $this->username, $this->password, $this->dbname);

        if ($conn->connect_error) {
            die("Connection Error: " . $conn->connect_error);
        }
        return $conn;
    }
}
?>
