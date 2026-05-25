# Quy tac ghep cap CV-JD cross-pair

Cross-pairs duoc tao de danh gia matcher khach quan hon so voi viec chi dung cac cap ung tuyen da co san. Neu mock CV da duoc ghep voi dung mock JD ngay tu dau, bo danh gia se qua de va khong kiem tra kha nang phan biet ung vien phu hop, gan phu hop va khong phu hop.

Loai cap:
- original_positive: CV va JD la cap dung vai tro trong mock data. Diem van duoc tinh lai bang matcher hien tai.
- cross_pair_medium: CV khac vai tro nhung co mot phan ky nang/kinh nghiem lien quan, dung de tao truong hop borderline.
- hard_negative: CV co mot vai tin hieu be ngoai co the gay nham lan nhung thieu yeu cau cot loi cua JD.
- easy_negative: CV thuoc vai tro khac ro rang va thieu gan nhu toan bo yeu cau cot loi.

Anh xa nhan con nguoi:
- High = 2
- Medium = 1
- Low = 0

Quy tac:
- human_label, human_relevance va reason phai duoc sinh vien doc va gan nhan thu cong.
- Khong dung system_score lam ground truth cho human_label.
- Moi cap JD-CV trong bang cross-pair phai duoc tinh diem bang matcher hien tai tu jd_text va cv_text.
- Diem cu tu application/mock result khong duoc dung lai cho cross-pair. Voi original_positive, script nay cung tinh lai diem de giu workflow nhat quan.
- Neu thieu JD text hoac CV text, dong do phai de evidence_quality la insufficient va nen bo trong nhan con nguoi.