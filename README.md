**Lần đầu**

    sudo systemctl start docker    
    docker compose up --build -d
    
**Những lần sau**

    sudo systemctl start docker
**ResetDB**

    docker compose down -v
    
**Tắt hết**
    
    docker compose stop
    //dừng nhưng ko tắt docker

    docker compose start
    //bật lại docker, ko build lại, ko tạo container mới
    
    sudo systemctl stop docker
    //dừng toàn bộ
    
    docker compose down
    //Dừng và xóa các container của project
    //Xóa cả network Docker do compose tạo
    //Không xóa volume dữ liệu, nên database vẫn có thể còn dữ liệu

    docker compose up --build -d
    //build lại khi có thay đổi về code
