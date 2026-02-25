<?php

namespace App\Database;

class Connection
{
    private $servername = "localhost";
    private $username = "vladislavs";
    private $password = "P@ssw0rd"; 
    private $dbname = "scandishop_db";

    public function connect()
    {
        $conn = new \mysqli($this->servername, $this->username, $this->password, $this->dbname);

        if ($conn->connect_error) {
            die("Connection Error: " . $conn->connect_error);
        }
        return $conn;
    }
}
