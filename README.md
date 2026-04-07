**Lần đầu**

    sudo systemctl start docker    
    docker compose up --build -d
    
**Những lần sau**

    sudo systemctl start docker
**ResetDB**

    docker compose down -v
    
**Tắt hết**
    
    docker compose stop
    **//dừng nhưng ko tắt docker**

    docker compose start
    **//bật lại docker, ko build lại, ko tạo container mới**
    
    sudo systemctl stop docker
    **//dừng toàn bộ**
    
    docker compose down
    **//Dừng và xóa các container của project
    //Xóa cả network Docker do compose tạo
    //Không xóa volume dữ liệu, nên database vẫn có thể còn dữ liệu**

        docker compose up --build -d
    **//build lại khi có thay đổi về code**
    
    //sau khi sửa code
    **sudo systemctl restart intelligent-cv-backend**

    
        sudo systemctl start docker
    **# bật Docker service trên máy**
        
        sudo docker start intelligent_cv_db
    # bật container PostgreSQL của project
        
        cd ~/intelligent-cv-screening/backend
    # đi vào thư mục backend
        
        source .venv/bin/activate
    # bật môi trường ảo Python của backend
        
        uvicorn app.main:app --reload
    # chạy FastAPI backend
    # sau lệnh này bạn mở được:
    # http://127.0.0.1:8000
    # http://127.0.0.1:8000/docs
        
        cd ~/intelligent-cv-screening
    # đi về thư mục gốc project    
        
        npm run dev
# chạy frontend Next.js
# sau lệnh này bạn mở được:
# http://localhost:3000
