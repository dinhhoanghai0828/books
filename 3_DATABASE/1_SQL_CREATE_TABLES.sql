DROP TABLE IF EXISTS `USERS`;
CREATE TABLE USERS (
	ID INT AUTO_INCREMENT PRIMARY KEY,
	USERNAME VARCHAR(100),
    PASSWORD VARCHAR(255) NOT NULL,
    CREATED_AT DATETIME(6) NULL DEFAULT NULL,
    UPDATED_AT DATETIME(6) NULL DEFAULT NULL,
    CREATED_BY VARCHAR(50) CHARACTER SET UTF8 COLLATE UTF8_GENERAL_CI NULL DEFAULT NULL,
    UPDATED_BY VARCHAR(50) CHARACTER SET UTF8 COLLATE UTF8_GENERAL_CI NULL DEFAULT NULL,
    INDEX IDX_USER_USERNAME (USERNAME),
    INDEX IDX_USER_PASSWORD (PASSWORD)
);
INSERT INTO USERS (USERNAME,PASSWORD) VALUE ('haidh8','$2a$10$ImmpRSLlf.WNugroQhaWTe3libE7.UrNeZpcDQxvgssOthhe1I0J6');


-- Bảng chính: CATEGORIES (đã gộp SUBCATEGORIES)
DROP TABLE IF EXISTS `CATEGORIES`;
CREATE TABLE CATEGORIES (
	ID INT AUTO_INCREMENT PRIMARY KEY,
    UUID VARCHAR(100) NOT NULL,
	SLUG VARCHAR(100),
    ENG VARCHAR(255) NOT NULL,
    VI VARCHAR(255) NOT NULL,
    PARENT_SLUG VARCHAR(100) NULL DEFAULT NULL,
    CREATED_AT DATETIME(6) NULL DEFAULT NULL,
    UPDATED_AT DATETIME(6) NULL DEFAULT NULL,
    CREATED_BY VARCHAR(50) CHARACTER SET UTF8 COLLATE UTF8_GENERAL_CI NULL DEFAULT NULL,
    UPDATED_BY VARCHAR(50) CHARACTER SET UTF8 COLLATE UTF8_GENERAL_CI NULL DEFAULT NULL,
	NUMBER INT,
    INDEX IDX_CATEGORIES_ENG (ENG),
    INDEX IDX_CATEGORIES_VI (VI),
    INDEX IDX_CATEGORIES_PARENT_SLUG (PARENT_SLUG),
    INDEX IDX_CATEGORIES_SLUG (SLUG)
);

-- Bảng tựa đề: TITLES
DROP TABLE IF EXISTS `BOOKS`;
CREATE TABLE BOOKS (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    UUID VARCHAR(100) NOT NULL,
	SLUG VARCHAR(100),
    ENG VARCHAR(500) NOT NULL,
	VI VARCHAR(500) NOT NULL,
    AUTHOR VARCHAR(255) NOT NULL,
    DESCRIPTION TEXT,
	IMG VARCHAR(255),
    CATEGORY_SLUG VARCHAR(100) NOT NULL,
	CREATED_AT DATETIME(6) NULL DEFAULT NULL,
    UPDATED_AT DATETIME(6) NULL DEFAULT NULL,
    CREATED_BY VARCHAR(50) CHARACTER SET UTF8 COLLATE UTF8_GENERAL_CI NULL DEFAULT NULL,
    UPDATED_BY VARCHAR(50) CHARACTER SET UTF8 COLLATE UTF8_GENERAL_CI NULL DEFAULT NULL,
	NUMBER INT,
	LEVEL INT,
	INDEX IDX_BOOKS_ENG (ENG),
	INDEX IDX_BOOKS_VI (VI),
	INDEX IDX_BOOKS_CATEGORY_SLUG (CATEGORY_SLUG)
);

-- Bảng tập: Volumes
DROP TABLE IF EXISTS `VOLUMES`;
CREATE TABLE VOLUMES (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    UUID VARCHAR(100) NOT NULL,
	SLUG VARCHAR(100),
    ENG VARCHAR(500) NOT NULL,
    VI VARCHAR(500) NOT NULL,
	AUDIO VARCHAR(255) NULL DEFAULT NULL,
	VIDEO VARCHAR(255) NULL DEFAULT NULL,
	IMG VARCHAR(255),
	START_TIME VARCHAR(100) NULL DEFAULT NULL,
    END_TIME VARCHAR(100) NULL DEFAULT NULL,
    BOOK_SLUG VARCHAR(100) NOT NULL,
    IS_LANGUAGE_APPROVED BOOLEAN NOT NULL DEFAULT 0,
    IS_REVIEW_COMPLETED BOOLEAN NOT NULL DEFAULT 0,
    IS_READ TINYINT(1) DEFAULT 0,
	CREATED_AT DATETIME(6) NULL DEFAULT NULL,
    UPDATED_AT DATETIME(6) NULL DEFAULT NULL,
    CREATED_BY VARCHAR(50) CHARACTER SET UTF8 COLLATE UTF8_GENERAL_CI NULL DEFAULT NULL,
    UPDATED_BY VARCHAR(50) CHARACTER SET UTF8 COLLATE UTF8_GENERAL_CI NULL DEFAULT NULL,
	NUMBER INT,
	INDEX IDX_VOLUMES_ENG (ENG),
    INDEX IDX_VOLUMES_VI (VI),
    INDEX IDX_VOLUMES_IS_LANGUAGE_APPROVED (IS_LANGUAGE_APPROVED),
    INDEX IDX_VOLUMES_IS_REVIEW_COMPLETED (IS_REVIEW_COMPLETED),
	INDEX IDX_VOLUMES_SLUG (SLUG),
	INDEX IDX_VOLUMES_BOOK_SLUG (BOOK_SLUG)
);

DROP TABLE IF EXISTS `CONTENTS`;
CREATE TABLE `CONTENTS`  (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    ENG VARCHAR(1000) CHARACTER SET UTF8 COLLATE UTF8_GENERAL_CI NOT NULL,
    VI VARCHAR(1000) CHARACTER SET UTF8 COLLATE UTF8_GENERAL_CI NOT NULL,
    START_TIME varchar(100) NULL DEFAULT NULL,
    END_TIME varchar(100) NULL DEFAULT NULL,
    VOLUME_SLUG VARCHAR(100) NOT NULL,
	CREATED_AT DATETIME(6) NULL DEFAULT NULL,
    UPDATED_AT DATETIME(6) NULL DEFAULT NULL,
    CREATED_BY VARCHAR(50) CHARACTER SET UTF8 COLLATE UTF8_GENERAL_CI NULL DEFAULT NULL,
	INDEX IDX_CONTENTS_ENG (ENG),
    INDEX IDX_CONTENTS_VI (VI),
	INDEX IDX_CONTENTS_VOLUME_SLUG (VOLUME_SLUG)
);
DROP TABLE IF EXISTS `WORDS`;
CREATE TABLE `WORDS` (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    ENG VARCHAR(200) CHARACTER SET UTF8 COLLATE UTF8_GENERAL_CI NOT NULL,
    VI VARCHAR(200) CHARACTER SET UTF8 COLLATE UTF8_GENERAL_CI NOT NULL,
    CREATED_AT DATETIME(6) NULL DEFAULT NULL,
    UPDATED_AT DATETIME(6) NULL DEFAULT NULL,
	INDEX `IDX_WORD_ENG`(`ENG`) USING BTREE,
	INDEX `IDX_WORD_VI`(`VI`) USING BTREE
);


DROP TABLE IF EXISTS `GOLD_INVESTMENTS`;
CREATE TABLE GOLD_INVESTMENTS (
    ID INT PRIMARY KEY AUTO_INCREMENT,
	INITIAL_CAPITAL DECIMAL(15,2), -- SỐ VỐN ĐẦU TƯ BAN ĐẦU
    GOLD_PRICE DECIMAL(15,2), -- GIÁ MUA VÀO MỖI CÂY VÀNG
    GOLD_QUANTITY DECIMAL(4,1), -- SỐ LƯỢNG CÂY VÀNG MUA
    GOLD_TYPE ENUM('Miếng', 'Nhẫn') NOT NULL, -- LOẠI VÀNG (MIẾNG HOẶC NHẪN)
    PURCHASE_DATE DATE,
	COMMENT VARCHAR(500)
);


INSERT INTO GOLD_INVESTMENTS (INITIAL_CAPITAL, GOLD_PRICE, GOLD_QUANTITY, GOLD_TYPE, PURCHASE_DATE, COMMENT)
VALUES 
(1150800000, 82200000, 14, 'Miếng', '2024-07-20', 'Giá vàng lúc đó là 78 triệu thấp hơn mua ở quán là 82.2 triệu'),
(117750000, 117750000, 1, 'Miếng', '2025-06-02', 'Giá vàng lúc đó là 117.75 triệu'),
(514400000, 128600000, 4, 'Miếng', '2025-08-24', 'Giá vàng lúc đó là 126.6 nhưng ngoài tiệm là 128.6 triệu'),
(132500000, 132500000, 1, 'Miếng', '2025-09-14', 'Giá vàng lúc đó là 131.1 nhưng ngoài tiệm là 132.5 triệu'),
(170000000, 85000000, 2, 'Nhẫn', '2024-11-04', 'Giá nhẫn lúc đó là 87 triệu cao hơn mua ở quán là 85 triệu'),
(102200000, 102200000, 1, 'Nhẫn', '2025-04-03','Giá vàng lúc đó là 102.2 triệu cao hơn mua ở quán thực ra là 99.2 triệu'),
(58200000, 116400000, 0.5, 'Nhẫn', '2025-05-16','Giá vàng lúc đó là 116.4 triệu'),
(10000000, 10000000, 0.1, 'Nhẫn', '2025-06-02', 'Giá vàng lúc đó là 113.7 triệu'),
(30900000, 154500000, 0.2, 'Nhẫn', '2026-05-03', 'Giá vàng lúc đó là 165.5 nhưng ngoài tiệm là 154 triệu'),
(29300000, 146500000, 0.2, 'Nhẫn', '2026-05-30', 'Giá vàng lúc đó là 158.8 nhưng ngoài tiệm là 146.5 triệu'),
(26660000, 133300000, 0.2, 'Nhẫn', '2026-07-03', 'Giá vàng lúc đó là 145.3 nhưng ngoài tiệm là 133.3 triệu'),
(26600000, 133000000, 0.2, 'Nhẫn', '2026-08-02', 'Giá vàng lúc đó là 140.5 nhưng ngoài tiệm là 133 triệu');
/* (42000000, 140000000, 0.3, 'Nhẫn', '2026-09-02', 'Giá vàng lúc đó là 140.5 nhưng ngoài tiệm là 140 triệu'); */


-- Bảng câu hỏi
DROP TABLE IF EXISTS `QUESTIONS`;
CREATE TABLE QUESTIONS (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    VOLUME_SLUG VARCHAR(100) NOT NULL,
    QUESTION_CODE VARCHAR(200) NOT NULL,
    QUESTION_TEXT VARCHAR(2000) NOT NULL,
	QUESTION_TEXT_VI VARCHAR(2000) NULL DEFAULT NULL,
    STATUS VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL,
    CREATED_AT DATETIME(6) NULL DEFAULT NULL,
    UPDATED_AT DATETIME(6) NULL DEFAULT NULL,
    CREATED_BY VARCHAR(50) CHARACTER SET UTF8 COLLATE UTF8_GENERAL_CI NULL DEFAULT NULL,
    UPDATED_BY VARCHAR(50) CHARACTER SET UTF8 COLLATE UTF8_GENERAL_CI NULL DEFAULT NULL,
    INDEX IDX_QUESTIONS_VOLUME_SLUG (VOLUME_SLUG),
    INDEX IDX_QUESTIONS_STATUS (STATUS),
    UNIQUE INDEX UK_QUESTIONS_QUESTION_CODE (QUESTION_CODE)
);

-- Bảng câu trả lời
DROP TABLE IF EXISTS `ANSWERS`;
CREATE TABLE ANSWERS (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    QUESTION_CODE VARCHAR(200) NOT NULL,
    ANSWER_CODE VARCHAR(200) NOT NULL,
    ANSWER_TEXT VARCHAR(2000) NOT NULL,
    ANSWER_TEXT_VI VARCHAR(2000) NOT NULL,
    IS_CORRECT CHAR(50) DEFAULT 'N' NOT NULL,
    DISPLAY_ORDER INT NOT NULL,
    CREATED_AT DATETIME(6) NULL DEFAULT NULL,
    UPDATED_AT DATETIME(6) NULL DEFAULT NULL,
    CREATED_BY VARCHAR(50) CHARACTER SET UTF8 COLLATE UTF8_GENERAL_CI NULL DEFAULT NULL,
    UPDATED_BY VARCHAR(50) CHARACTER SET UTF8 COLLATE UTF8_GENERAL_CI NULL DEFAULT NULL,
    INDEX IDX_ANSWERS_QUESTION_CODE (QUESTION_CODE),
    UNIQUE INDEX UK_ANSWERS_QUESTION_OPTION (QUESTION_CODE, ANSWER_CODE)
);


DROP TABLE IF EXISTS `MATH_CATEGORIES`;
CREATE TABLE MATH_CATEGORIES (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    CATEGORY_CODE VARCHAR(100) NOT NULL,
    CATEGORY_NAME VARCHAR(500) NOT NULL,
    PARENT_ID INT NULL,
    STATUS VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    CREATED_AT DATETIME(6) NULL DEFAULT NULL,
    UPDATED_AT DATETIME(6) NULL DEFAULT NULL,
    CREATED_BY VARCHAR(50) CHARACTER SET UTF8 COLLATE UTF8_GENERAL_CI NULL DEFAULT NULL,
    UPDATED_BY VARCHAR(50) CHARACTER SET UTF8 COLLATE UTF8_GENERAL_CI NULL DEFAULT NULL,
    INDEX IDX_MATH_CATEGORIES_PARENT_ID (PARENT_ID),
    INDEX IDX_MATH_CATEGORIES_STATUS (STATUS),
    UNIQUE INDEX UK_MATH_CATEGORIES_CODE (CATEGORY_CODE)
);

DROP TABLE IF EXISTS `MATH_QUESTIONS`;
CREATE TABLE MATH_QUESTIONS (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    CATEGORY_CODE VARCHAR(100) NOT NULL,
    QUESTION_CODE VARCHAR(200) NOT NULL,
    QUESTION_TEXT VARCHAR(2000) NOT NULL,
    DIFFICULTY INT NOT NULL,
    STATUS VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL,
    CREATED_AT DATETIME(6) NULL DEFAULT NULL,
    UPDATED_AT DATETIME(6) NULL DEFAULT NULL,
    CREATED_BY VARCHAR(50) CHARACTER SET UTF8 COLLATE UTF8_GENERAL_CI NULL DEFAULT NULL,
    UPDATED_BY VARCHAR(50) CHARACTER SET UTF8 COLLATE UTF8_GENERAL_CI NULL DEFAULT NULL,
    INDEX IDX_MATH_QUESTIONS_CATEGORY_CODE (CATEGORY_CODE),
    INDEX IDX_MATH_QUESTIONS_STATUS (STATUS),
    UNIQUE INDEX UK_MATH_QUESTIONS_CODE (QUESTION_CODE)
);

DROP TABLE IF EXISTS `MATH_ANSWERS`;
CREATE TABLE MATH_ANSWERS (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    QUESTION_CODE VARCHAR(200) NOT NULL,
    ANSWER_CODE VARCHAR(10) NOT NULL,
    ANSWER_TEXT VARCHAR(2000) NOT NULL,
    IS_CORRECT CHAR(1) DEFAULT 'N' NOT NULL,
    CREATED_AT DATETIME(6) NULL DEFAULT NULL,
    UPDATED_AT DATETIME(6) NULL DEFAULT NULL,
    CREATED_BY VARCHAR(50) CHARACTER SET UTF8 COLLATE UTF8_GENERAL_CI NULL DEFAULT NULL,
    UPDATED_BY VARCHAR(50) CHARACTER SET UTF8 COLLATE UTF8_GENERAL_CI NULL DEFAULT NULL,
    INDEX IDX_MATH_ANSWERS_QUESTION_CODE (QUESTION_CODE),
    UNIQUE INDEX UK_MATH_ANSWERS_QUESTION_CODE(QUESTION_CODE, ANSWER_CODE)
);

-- Parent: DÃY SỐ VÀ QUY LUẬT
-- Parent: SUY LUẬN LOGIC
INSERT INTO MATH_CATEGORIES (ID, CATEGORY_CODE, CATEGORY_NAME, PARENT_ID, STATUS, CREATED_AT, UPDATED_AT) VALUES
-- Parent: 1. DÃY SỐ VÀ QUY LUẬT
(1, 'NUMBER', 'DÃY SỐ VÀ QUY LUẬT', NULL, 'ACTIVE', NULL, NULL),
-- Parent: 2. SUY LUẬN LOGIC
(2, 'LOGIC', 'SUY LUẬN LOGIC', NULL, 'ACTIVE', NULL, NULL),
-- Child: 1.1. Dãy tăng đều
(3, 'NUMBER_INCREASING', 'Dãy tăng đều', 1, 'ACTIVE', NULL, NULL),
-- Child: 1.2. Dãy giảm đều
(4, 'NUMBER_DECREASING', 'Dãy giảm đều', 1, 'ACTIVE', NULL, NULL),
-- Child: 1.3. Dãy xen kẽ
(5, 'NUMBER_ALTERNATING', 'Dãy xen kẽ', 1, 'ACTIVE', NULL, NULL),
-- Child: 1.4. Dãy có khoảng cách thay đổi
(6, 'NUMBER_VARIABLE_INTERVAL', 'Dãy có khoảng cách thay đổi', 1, 'ACTIVE', NULL, NULL),
-- Child: 1.5. Dãy kết hợp nhiều quy luật
(7, 'NUMBER_MULTI_RULE', 'Dãy kết hợp nhiều quy luật', 1, 'ACTIVE', NULL, NULL),
-- Child: 1.7. Dãy số đặc biệt
(8, 'NUMBER_SPECIAL', 'Dãy số đặc biệt', 1, 'ACTIVE', NULL, NULL),
-- Child: 1.8. Phát hiện số sai
(9, 'NUMBER_WRONG_NUMBER', 'Phát hiện số sai', 1, 'ACTIVE', NULL, NULL),

-- Child: 2.1. So sánh
(10, 'LOGIC_COMPARISON', 'So sánh', 2, 'ACTIVE', NULL, NULL),
-- Child: 2.2. Suy luận thứ tự
(11, 'LOGIC_ORDER', 'Suy luận thứ tự', 2, 'ACTIVE', NULL, NULL),
-- Child: 2.3. Tìm vị trí
(12, 'LOGIC_POSITION', 'Tìm vị trí', 2, 'ACTIVE', NULL, NULL),
-- Child: 2.4. Đúng – sai
(13, 'LOGIC_TRUE_FALSE', 'Đúng – sai', 2, 'ACTIVE', NULL, NULL),
-- Child: 2.5. Loại trừ
(14, 'LOGIC_ELIMINATION', 'Loại trừ', 2, 'ACTIVE', NULL, NULL),
-- Child: 2.6. Ghép đôi
(15, 'LOGIC_MATCHING', 'Ghép đôi', 2, 'ACTIVE', NULL, NULL),
-- Child: 2.7. Phân loại
(16, 'LOGIC_CLASSIFICATION', 'Phân loại', 2, 'ACTIVE', NULL, NULL),
-- Child: 2.8. Suy luận nhiều điều kiện
(17, 'LOGIC_MULTI_CONDITION', 'Suy luận nhiều điều kiện', 2, 'ACTIVE', NULL, NULL),
-- Child: 2.9. Chắc chắn đúng
(18, 'LOGIC_CERTAIN_TRUE', 'Chắc chắn đúng', 2, 'ACTIVE', NULL, NULL),
-- Child: 2.10. Chắc chắn sai / không thể xảy ra
(19, 'LOGIC_CERTAIN_FALSE', 'Chắc chắn sai / không thể xảy ra', 2, 'ACTIVE', NULL, NULL),
-- Child: 2.11. Suy luận nhiều tầng
(20, 'LOGIC_MULTI_LEVEL', 'Suy luận nhiều tầng', 2, 'ACTIVE', NULL, NULL),

-- Parent: 3. TÌM SỐ CHƯA BIẾT
(21, 'UNKNOWN_NUMBER', 'TÌM SỐ CHƯA BIẾT', NULL, 'ACTIVE', NULL, NULL),
-- Child: 3.1. Tìm số hạng chưa biết
(22, 'UNKNOWN_NUMBER_TERM', 'Tìm số hạng chưa biết', 21, 'ACTIVE', NULL, NULL),
-- Child: 3.2. Tìm số bị trừ
(23, 'UNKNOWN_NUMBER_MINUEND', 'Tìm số bị trừ', 21, 'ACTIVE', NULL, NULL),
-- Child: 3.3. Tìm số trừ
(24, 'UNKNOWN_NUMBER_SUBTRAHEND', 'Tìm số trừ', 21, 'ACTIVE', NULL, NULL),
-- Child: 3.4. Tìm số lớn hơn/nhỏ hơn
(25, 'UNKNOWN_NUMBER_GREATER_LESS', 'Tìm số lớn hơn/nhỏ hơn', 21, 'ACTIVE', NULL, NULL),
-- Child: 3.5. Tìm số dựa vào tổng
(26, 'UNKNOWN_NUMBER_BY_SUM', 'Tìm số dựa vào tổng', 21, 'ACTIVE', NULL, NULL),
-- Child: 3.6. Tìm số dựa vào hiệu
(27, 'UNKNOWN_NUMBER_BY_DIFFERENCE', 'Tìm số dựa vào hiệu', 21, 'ACTIVE', NULL, NULL),
-- Child: 3.7. Tìm số trong sơ đồ
(28, 'UNKNOWN_NUMBER_DIAGRAM', 'Tìm số trong sơ đồ', 21, 'ACTIVE', NULL, NULL),
-- Child: 3.8. Tìm số trong phép tính liên hoàn
(29, 'UNKNOWN_NUMBER_CHAIN_CALCULATION', 'Tìm số trong phép tính liên hoàn', 21, 'ACTIVE', NULL, NULL),
-- Child: 3.9. Tìm số trong nhiều phép tính
(30, 'UNKNOWN_NUMBER_MULTIPLE_CALCULATION', 'Tìm số trong nhiều phép tính', 21, 'ACTIVE', NULL, NULL),
-- Child: 3.10. Tìm số thỏa mãn điều kiện
(31, 'UNKNOWN_NUMBER_CONDITION', 'Tìm số thỏa mãn điều kiện', 21, 'ACTIVE', NULL, NULL),
-- Child: 3.11. Tìm nhiều số có thể xảy ra
(32, 'UNKNOWN_NUMBER_MULTIPLE_POSSIBILITIES', 'Tìm nhiều số có thể xảy ra', 21, 'ACTIVE', NULL, NULL),
-- Child: 3.12. Tìm số duy nhất
(33, 'UNKNOWN_NUMBER_UNIQUE', 'Tìm số duy nhất', 21, 'ACTIVE', NULL, NULL),

-- Parent: 4. BÀI TOÁN NGƯỢC
(34, 'REVERSE_PROBLEM', 'BÀI TOÁN NGƯỢC', NULL, 'ACTIVE', NULL, NULL),
-- Child: 4.1. Biết kết quả → tìm số ban đầu
(35, 'REVERSE_RESULT_TO_INITIAL', 'Biết kết quả → tìm số ban đầu', 34, 'ACTIVE', NULL, NULL),
-- Child: 4.2. Thêm vào rồi tìm ban đầu
(36, 'REVERSE_ADD_TO_INITIAL', 'Thêm vào rồi tìm ban đầu', 34, 'ACTIVE', NULL, NULL),
-- Child: 4.3. Bớt đi rồi tìm ban đầu
(37, 'REVERSE_SUBTRACT_TO_INITIAL', 'Bớt đi rồi tìm ban đầu', 34, 'ACTIVE', NULL, NULL),
-- Child: 4.4. Cho đi rồi nhận lại
(38, 'REVERSE_GIVE_AND_RECEIVE', 'Cho đi rồi nhận lại', 34, 'ACTIVE', NULL, NULL),
-- Child: 4.5. Tăng rồi giảm → tìm ban đầu
(39, 'REVERSE_INCREASE_DECREASE', 'Tăng rồi giảm → tìm ban đầu', 34, 'ACTIVE', NULL, NULL),
-- Child: 4.6. Giảm rồi tăng → tìm ban đầu
(40, 'REVERSE_DECREASE_INCREASE', 'Giảm rồi tăng → tìm ban đầu', 34, 'ACTIVE', NULL, NULL),
-- Child: 4.7. Bài toán ngược về số lượng
(41, 'REVERSE_QUANTITY', 'Bài toán ngược về số lượng', 34, 'ACTIVE', NULL, NULL),
-- Child: 4.8. Bài toán ngược về tuổi
(42, 'REVERSE_AGE', 'Bài toán ngược về tuổi', 34, 'ACTIVE', NULL, NULL),
-- Child: 4.9. Bài toán ngược nhiều bước
(43, 'REVERSE_MULTI_STEP', 'Bài toán ngược nhiều bước', 34, 'ACTIVE', NULL, NULL),
-- Child: 4.10. Bài toán ngược kết hợp điều kiện
(44, 'REVERSE_WITH_CONDITION', 'Bài toán ngược kết hợp điều kiện', 34, 'ACTIVE', NULL, NULL),

-- Parent: 5. BÀI TOÁN NHIỀU BƯỚC
(45, 'MULTI_STEP_PROBLEM', 'BÀI TOÁN NHIỀU BƯỚC', NULL, 'ACTIVE', NULL, NULL),
-- Child: 5.1. Hai bước cộng
(46, 'MULTI_STEP_TWO_ADDITIONS', 'Hai bước cộng', 45, 'ACTIVE', NULL, NULL),
-- Child: 5.2. Hai bước trừ
(47, 'MULTI_STEP_TWO_SUBTRACTIONS', 'Hai bước trừ', 45, 'ACTIVE', NULL, NULL),
-- Child: 5.3. Cộng rồi trừ
(48, 'MULTI_STEP_ADD_SUBTRACT', 'Cộng rồi trừ', 45, 'ACTIVE', NULL, NULL),
-- Child: 5.4. Trừ rồi cộng
(49, 'MULTI_STEP_SUBTRACT_ADD', 'Trừ rồi cộng', 45, 'ACTIVE', NULL, NULL),
-- Child: 5.5. Tìm tổng sau nhiều bước
(50, 'MULTI_STEP_SUM', 'Tìm tổng sau nhiều bước', 45, 'ACTIVE', NULL, NULL),
-- Child: 5.6. Tìm phần còn lại
(51, 'MULTI_STEP_REMAINING', 'Tìm phần còn lại', 45, 'ACTIVE', NULL, NULL),
-- Child: 5.7. Ba bước tính toán
(52, 'MULTI_STEP_THREE_OPERATIONS', 'Ba bước tính toán', 45, 'ACTIVE', NULL, NULL),
-- Child: 5.8. Bài toán nhiều đối tượng
(53, 'MULTI_STEP_MULTIPLE_OBJECTS', 'Bài toán nhiều đối tượng', 45, 'ACTIVE', NULL, NULL),
-- Child: 5.9. Bài toán thay đổi liên tiếp
(54, 'MULTI_STEP_CONTINUOUS_CHANGE', 'Bài toán thay đổi liên tiếp', 45, 'ACTIVE', NULL, NULL),
-- Child: 5.10. Bài toán nhiều bước có dữ kiện thừa
(55, 'MULTI_STEP_EXTRA_DATA', 'Bài toán nhiều bước có dữ kiện thừa', 45, 'ACTIVE', NULL, NULL),
-- Child: 5.11. Bài toán nhiều bước cần chọn phép tính
(56, 'MULTI_STEP_CHOOSE_OPERATION', 'Bài toán nhiều bước cần chọn phép tính', 45, 'ACTIVE', NULL, NULL),
-- Child: 5.12. Bài toán nhiều bước nâng cao
(57, 'MULTI_STEP_ADVANCED', 'Bài toán nhiều bước nâng cao', 45, 'ACTIVE', NULL, NULL),

-- Parent: 6. BÀI TOÁN NHIỀU ĐIỀU KIỆN
(58, 'MULTI_CONDITION_PROBLEM', 'BÀI TOÁN NHIỀU ĐIỀU KIỆN', NULL, 'ACTIVE', NULL, NULL),
-- Child: 6.1. Tìm số thỏa mãn 2 điều kiện
(59, 'MULTI_CONDITION_TWO', 'Tìm số thỏa mãn 2 điều kiện', 58, 'ACTIVE', NULL, NULL),
-- Child: 6.2. Tìm số thỏa mãn 3 điều kiện
(60, 'MULTI_CONDITION_THREE', 'Tìm số thỏa mãn 3 điều kiện', 58, 'ACTIVE', NULL, NULL),
-- Child: 6.3. Lớn hơn – nhỏ hơn
(61, 'MULTI_CONDITION_GREATER_LESS', 'Lớn hơn – nhỏ hơn', 58, 'ACTIVE', NULL, NULL),
-- Child: 6.4. Nằm giữa hai số
(62, 'MULTI_CONDITION_BETWEEN', 'Nằm giữa hai số', 58, 'ACTIVE', NULL, NULL),
-- Child: 6.5. Số chẵn/số lẻ + điều kiện
(63, 'MULTI_CONDITION_EVEN_ODD', 'Số chẵn/số lẻ + điều kiện', 58, 'ACTIVE', NULL, NULL),
-- Child: 6.6. So sánh nhiều đối tượng
(64, 'MULTI_CONDITION_COMPARE_OBJECTS', 'So sánh nhiều đối tượng', 58, 'ACTIVE', NULL, NULL),
-- Child: 6.7. Sắp xếp theo nhiều điều kiện
(65, 'MULTI_CONDITION_SORT', 'Sắp xếp theo nhiều điều kiện', 58, 'ACTIVE', NULL, NULL),
-- Child: 6.8. Vị trí + điều kiện
(66, 'MULTI_CONDITION_POSITION', 'Vị trí + điều kiện', 58, 'ACTIVE', NULL, NULL),
-- Child: 6.9. Loại trừ nhiều điều kiện
(67, 'MULTI_CONDITION_ELIMINATION', 'Loại trừ nhiều điều kiện', 58, 'ACTIVE', NULL, NULL),
-- Child: 6.10. Tìm đáp án chắc chắn đúng
(68, 'MULTI_CONDITION_CERTAIN_TRUE', 'Tìm đáp án chắc chắn đúng', 58, 'ACTIVE', NULL, NULL),
-- Child: 6.11. Tìm đáp án có thể đúng
(69, 'MULTI_CONDITION_POSSIBLE_TRUE', 'Tìm đáp án có thể đúng', 58, 'ACTIVE', NULL, NULL),
-- Child: 6.12. Tìm đáp án không thể đúng
(70, 'MULTI_CONDITION_IMPOSSIBLE', 'Tìm đáp án không thể đúng', 58, 'ACTIVE', NULL, NULL),
-- Child: 6.13. Điều kiện về số lượng
(71, 'MULTI_CONDITION_QUANTITY', 'Điều kiện về số lượng', 58, 'ACTIVE', NULL, NULL),
-- Child: 6.14. Điều kiện về thứ tự
(72, 'MULTI_CONDITION_ORDER', 'Điều kiện về thứ tự', 58, 'ACTIVE', NULL, NULL),
-- Child: 6.15. Điều kiện kết hợp
(73, 'MULTI_CONDITION_COMBINED', 'Điều kiện kết hợp', 58, 'ACTIVE', NULL, NULL),
-- Child: 6.16. Bài toán nhiều trường hợp
(74, 'MULTI_CONDITION_MULTIPLE_CASES', 'Bài toán nhiều trường hợp', 58, 'ACTIVE', NULL, NULL),

-- Parent: 7. ĐẾM HÌNH VÀ TƯ DUY HÌNH HỌC
(75, 'GEOMETRY_COUNTING', 'ĐẾM HÌNH VÀ TƯ DUY HÌNH HỌC', NULL, 'ACTIVE', NULL, NULL),
-- Child: 7.1. Nhận biết hình
(76, 'GEOMETRY_IDENTIFY_SHAPE', 'Nhận biết hình', 75, 'ACTIVE', NULL, NULL),
-- Child: 7.2. Đếm hình cơ bản
(77, 'GEOMETRY_BASIC_COUNTING', 'Đếm hình cơ bản', 75, 'ACTIVE', NULL, NULL),
-- Child: 7.3. Đếm hình chồng lên nhau
(78, 'GEOMETRY_OVERLAPPING_COUNTING', 'Đếm hình chồng lên nhau', 75, 'ACTIVE', NULL, NULL),
-- Child: 7.4. Đếm hình trong hình lớn
(79, 'GEOMETRY_COUNTING_IN_LARGE_SHAPE', 'Đếm hình trong hình lớn', 75, 'ACTIVE', NULL, NULL),
-- Child: 7.5. Tìm hình giống nhau
(80, 'GEOMETRY_FIND_SAME', 'Tìm hình giống nhau', 75, 'ACTIVE', NULL, NULL),
-- Child: 7.6. Tìm hình khác nhau
(81, 'GEOMETRY_FIND_DIFFERENT', 'Tìm hình khác nhau', 75, 'ACTIVE', NULL, NULL),
-- Child: 7.7. Ghép hình
(82, 'GEOMETRY_COMBINE_SHAPES', 'Ghép hình', 75, 'ACTIVE', NULL, NULL),
-- Child: 7.8. Tách hình
(83, 'GEOMETRY_SPLIT_SHAPES', 'Tách hình', 75, 'ACTIVE', NULL, NULL),
-- Child: 7.9. Hình còn thiếu
(84, 'GEOMETRY_MISSING_SHAPE', 'Hình còn thiếu', 75, 'ACTIVE', NULL, NULL),
-- Child: 7.10. Hình đối xứng đơn giản
(85, 'GEOMETRY_SIMPLE_SYMMETRY', 'Hình đối xứng đơn giản', 75, 'ACTIVE', NULL, NULL),
-- Child: 7.11. Quy luật hình học
(86, 'GEOMETRY_PATTERN', 'Quy luật hình học', 75, 'ACTIVE', NULL, NULL),
-- Child: 7.12. Hình quay / thay đổi vị trí
(87, 'GEOMETRY_ROTATION_POSITION', 'Hình quay / thay đổi vị trí', 75, 'ACTIVE', NULL, NULL),
-- Child: 7.13. Đường đi trên lưới
(88, 'GEOMETRY_GRID_PATH', 'Đường đi trên lưới', 75, 'ACTIVE', NULL, NULL),
-- Child: 7.14. Đếm đoạn thẳng
(89, 'GEOMETRY_SEGMENT_COUNTING', 'Đếm đoạn thẳng', 75, 'ACTIVE', NULL, NULL),
-- Child: 7.15. Tìm đường ngắn/dài
(90, 'GEOMETRY_SHORTEST_LONGEST_PATH', 'Tìm đường ngắn/dài', 75, 'ACTIVE', NULL, NULL),
-- Child: 7.16. Tư duy không gian
(91, 'GEOMETRY_SPATIAL_REASONING', 'Tư duy không gian', 75, 'ACTIVE', NULL, NULL),
-- Child: 7.17. Hình học kết hợp số
(92, 'GEOMETRY_NUMBER_COMBINATION', 'Hình học kết hợp số', 75, 'ACTIVE', NULL, NULL),

-- Parent: 8. BÀI TOÁN TƯ DUY TỔNG HỢP
(93, 'GENERAL_REASONING', 'BÀI TOÁN TƯ DUY TỔNG HỢP', NULL, 'ACTIVE', NULL, NULL),
-- Child: 8.1. Tính toán + suy luận
(94, 'GENERAL_CALCULATION_REASONING', 'Tính toán + suy luận', 93, 'ACTIVE', NULL, NULL),
-- Child: 8.2. Dãy số + điều kiện
(95, 'GENERAL_SEQUENCE_CONDITION', 'Dãy số + điều kiện', 93, 'ACTIVE', NULL, NULL),
-- Child: 8.3. Tìm số + điều kiện
(96, 'GENERAL_NUMBER_CONDITION', 'Tìm số + điều kiện', 93, 'ACTIVE', NULL, NULL),
-- Child: 8.4. Bài toán ngược + nhiều bước
(97, 'GENERAL_REVERSE_MULTI_STEP', 'Bài toán ngược + nhiều bước', 93, 'ACTIVE', NULL, NULL),
-- Child: 8.5. Logic + số học
(98, 'GENERAL_LOGIC_ARITHMETIC', 'Logic + số học', 93, 'ACTIVE', NULL, NULL),
-- Child: 8.6. Logic + hình học
(99, 'GENERAL_LOGIC_GEOMETRY', 'Logic + hình học', 93, 'ACTIVE', NULL, NULL),
-- Child: 8.7. Hình học + đếm số
(100, 'GENERAL_GEOMETRY_COUNTING', 'Hình học + đếm số', 93, 'ACTIVE', NULL, NULL),
-- Child: 8.8. Nhiều bước + nhiều điều kiện
(101, 'GENERAL_MULTI_STEP_CONDITION', 'Nhiều bước + nhiều điều kiện', 93, 'ACTIVE', NULL, NULL),
-- Child: 8.9. Bài toán có dữ kiện thừa
(102, 'GENERAL_EXTRA_DATA', 'Bài toán có dữ kiện thừa', 93, 'ACTIVE', NULL, NULL),
-- Child: 8.10. Bài toán thiếu dữ kiện
(103, 'GENERAL_MISSING_DATA', 'Bài toán thiếu dữ kiện', 93, 'ACTIVE', NULL, NULL),
-- Child: 8.11. Tìm tất cả khả năng
(104, 'GENERAL_ALL_POSSIBILITIES', 'Tìm tất cả khả năng', 93, 'ACTIVE', NULL, NULL),
-- Child: 8.12. Tìm khả năng duy nhất
(105, 'GENERAL_UNIQUE_POSSIBILITY', 'Tìm khả năng duy nhất', 93, 'ACTIVE', NULL, NULL),
-- Child: 8.13. Chọn phương án đúng
(106, 'GENERAL_CHOOSE_CORRECT', 'Chọn phương án đúng', 93, 'ACTIVE', NULL, NULL),
-- Child: 8.14. Chọn phương án sai
(107, 'GENERAL_CHOOSE_INCORRECT', 'Chọn phương án sai', 93, 'ACTIVE', NULL, NULL),
-- Child: 8.15. Chắc chắn đúng / có thể đúng / không thể đúng
(108, 'GENERAL_CERTAINTY_POSSIBILITY', 'Chắc chắn đúng / có thể đúng / không thể đúng', 93, 'ACTIVE', NULL, NULL),
-- Child: 8.16. Bài toán suy luận ngược nhiều tầng
(109, 'GENERAL_REVERSE_MULTI_LEVEL', 'Bài toán suy luận ngược nhiều tầng', 93, 'ACTIVE', NULL, NULL),
-- Child: 8.17. Bài toán tổng hợp 3–4 điều kiện
(110, 'GENERAL_THREE_FOUR_CONDITIONS', 'Bài toán tổng hợp 3–4 điều kiện', 93, 'ACTIVE', NULL, NULL),
-- Child: 8.18. Câu đố tư duy tổng hợp
(111, 'GENERAL_COMPREHENSIVE_PUZZLE', 'Câu đố tư duy tổng hợp', 93, 'ACTIVE', NULL, NULL);


