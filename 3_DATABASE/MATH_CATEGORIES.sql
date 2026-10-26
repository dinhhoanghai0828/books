
INSERT INTO MATH_CATEGORIES (CATEGORY_CODE, FULL_PATH, CATEGORY_NAME, CATEGORY_DESC, PARENT_CODE, STATUS, CREATED_AT, UPDATED_AT) VALUES
	-- Parent: 1. Toán tư duy
	('MATH_LOGIC', 'toan/lop-1', '1. Toán tư duy', 'Học sinh làm quen với số', NULL, 'ACTIVE', NULL, NULL),
	-- Parent: 2. Toán có lời văn
	('MATH_WORD_PROBLEMS', 'toan/lop-1', '2. Toán có lời văn', 'Học sinh làm toán với các bài tự luận', NULL, 'ACTIVE', NULL, NULL),
	-- Parent: 3. Tư duy tổng hợp
	('COMPREHENSIVE', 'toan/lop-1', '10. Tư duy tổng hợp', 'Kết hợp nhiều kỹ năng toán học và tư duy đã học để giải quyết bài toán.', NULL, 'ACTIVE', NULL, NULL),
	
	-- Child: 1.1. Sắp xếp các số
	('NUMBER_BASIC_SORT', 'toan/lop-1', 'Sắp xếp các số', 'Sắp xếp các số từ bé đến lớn hoặc từ lớn đến bé.', 'MATH_LOGIC', 'ACTIVE', NULL, NULL),
	-- Child: 1.2. Tìm số chẵn, số lẻ trong dãy số
	('NUMBER_BASIC_EVEN_ODD', 'toan/lop-1', 'Tìm số chẵn, số lẻ trong dãy số', 'Nhận biết và phân loại số chẵn, số lẻ. Tìm số chẵn, số lẻ còn thiếu trong dãy số', 'MATH_LOGIC', 'ACTIVE', NULL, NULL),
	-- Child: 1.3. Tìm số với quy luật dãy số tăng đều
	('NUMBER_PATTERN_ADD_EQUAL', 'toan/lop-1', 'Tìm số với quy luật dãy số tăng đều', 'Dãy số tăng theo một quy luật cố định, mỗi lần tăng thêm cùng một số. Tìm số còn thiếu trong dãy số', 'MATH_LOGIC', 'ACTIVE', NULL, NULL),
	-- Child: 1.4. Tìm số với quy luật dãy số tăng không đều
	('NUMBER_PATTERN_INCREASING', 'toan/lop-1', 'Tìm số với quy luật dãy số tăng đều', 'Dãy số tăng theo một quy luật không cố định, tăng lớn dần đều. Tìm số còn thiếu trong dãy số', 'MATH_LOGIC', 'ACTIVE', NULL, NULL),
	-- Child: 1.5. Tìm số với quy luật dãy số giảm đều
	('NUMBER_PATTERN_SUB_EQUAL', 'toan/lop-1', 'Tìm số với quy luật dãy số giảm đều', 'Dãy số giảm theo một quy luật cố định, mỗi lần giảm thêm cùng một số. Tìm số còn thiếu trong dãy số', 'MATH_LOGIC', 'ACTIVE', NULL, NULL),
	-- Child: 1.6. Tìm số với quy luật dãy số giảm không đều
	('NUMBER_PATTERN_DECREASING', 'toan/lop-1', 'Tìm số với quy luật dãy số giảm đều', 'Dãy số giảm theo một quy luật không cố định, giảm nhỏ dần đều. Tìm số còn thiếu trong dãy số', 'MATH_LOGIC', 'ACTIVE', NULL, NULL),
	-- Child: 1.7. Tìm số với quy luật dãy số tăng/giảm xen kẽ
	('NUMBER_PATTERN_ALTERNATE', 'toan/lop-1', 'Tìm số với quy luật dãy số tăng/giảm xen kẽ', 'Dãy số thay đổi theo hai quy luật luân phiên, lúc tăng lúc giảm. Tìm số còn thiếu trong dãy số', 'MATH_LOGIC', 'ACTIVE', NULL, NULL),
	-- Child: 1.8. Tìm số với quy luật dãy số lặp lại
	('NUMBER_PATTERN_REPEAT', 'toan/lop-1', 'Tìm số với quy luật dãy số lặp lại', 'Dãy số có quy luật được lặp đi lặp lại. Tìm số còn thiếu trong dãy số', 'MATH_LOGIC', 'ACTIVE', NULL, NULL),
	-- Child: 1.9. Tìm số ở giữa một dãy số có quy luật
	('NUMBER_PATTERN_MISSING', 'toan/lop-1', 'Tìm số ở giữa một dãy số có quy luật', 'Tìm số bị thiếu ở giữa một dãy số có quy luật', 'MATH_LOGIC', 'ACTIVE', NULL, NULL),
	-- Child: 1.10. Tìm tổng của hai hoặc nhiều số
	('CALCULATION_ADDITION', 'toan/lop-1', 'Tìm tổng của hai hoặc nhiều số', 'Tính tổng của hai hoặc nhiều số', 'MATH_LOGIC', 'ACTIVE', NULL, NULL),
	-- Child: 1.11. Tìm hiệu của hai hoặc nhiều số
	('CALCULATION_SUBTRACTION', 'toan/lop-1', 'Tìm hiệu của hai hoặc nhiều số', 'Tìm hiệu của hai hoặc nhiều số', 'MATH_LOGIC', 'ACTIVE', NULL, NULL),
	-- Child: 1.12. Tìm kết quả của phép tính kết hợp + và -
	('CALCULATION_MIXED_ADDITION_SUBTRACTION', 'toan/lop-1', 'Tìm kết quả của phép tính kết hợp + và -', 'Tìm kết quả của phép tính kết hợp + và -', 'MATH_LOGIC', 'ACTIVE', NULL, NULL),
	-- Child: 1.13. Tìm số bị trừ của 2 hoặc nhiều số
	('CALCULATION_MINUEND', 'toan/lop-1', 'Tìm số bị trừ của 2 hoặc nhiều số', 'Tìm số bị trừ của 2 hoặc nhiều số', 'MATH_LOGIC', 'ACTIVE', NULL, NULL),
	-- Child: 1.14. Tìm số trừ của 2 hoặc nhiều số
	('CALCULATION_SUBTRAHEND', 'toan/lop-1', 'Tìm số trừ của 2 hoặc nhiều số', 'Tìm số trừ của 2 hoặc nhiều số', 'CALCULATION', 'ACTIVE', NULL, NULL),

	-- Child: 2.1. Tìm số qua một phép tính
	('UNKNOWN_NUMBER_SINGLE_CALC', 'toan/lop-1', 'Tìm số qua một phép tính', 'Tìm số qua một phép tính', 'MATH_WORD_PROBLEMS', 'ACTIVE', NULL, NULL),
	-- Child: 2.2. Tìm số qua nhiều phép tính
	('UNKNOWN_NUMBER_MULTI_CALC', 'toan/lop-1', 'Tìm số qua nhiều phép tính', 'Cần thực hiện từ hai phép tính trở lên để tìm số.', 'MATH_WORD_PROBLEMS', 'ACTIVE', NULL, NULL),
	-- Child: 2.3. Tìm hai số khi biết tổng và hiệu
	('UNKNOWN_NUMBER_SUM_DIFFERENCE', 'toan/lop-1', 'Tìm hai số khi biết tổng và hiệu', 'Biết tổng và hiệu của hai số, tìm hai số đó.', 'MATH_WORD_PROBLEMS', 'ACTIVE', NULL, NULL),
	-- Child: 2.4. Tìm hai số khi biết tổng và hiệu qua biểu thức
	('UNKNOWN_NUMBER_SUM_DIFFERENCE_CALC', 'toan/lop-1', 'Tìm hai số khi biết tổng và hiệu qua biểu thức', 'Tính tổng hoặc hiệu từ biểu thức đã cho, sau đó tìm hai số.', 'MATH_WORD_PROBLEMS', 'ACTIVE', NULL, NULL),

	-- Child: 2.5. Hai bước cộng
	('MULTI_STEP_ADD_ADD', 'toan/lop-1', 'Hai bước cộng', 'Thực hiện hai lần thêm vào.', 'MATH_WORD_PROBLEMS', 'ACTIVE', NULL, NULL),
	-- Child: 2.6. Hai bước trừ
	('MULTI_STEP_SUB_SUB', 'toan/lop-1', 'Hai bước trừ', 'Thực hiện hai lần bớt đi.', 'MATH_WORD_PROBLEMS', 'ACTIVE', NULL, NULL),
	-- Child: 2.7. Cộng rồi trừ
	('MULTI_STEP_ADD_SUB', 'toan/lop-1', 'Cộng rồi trừ', 'Trước tiên thêm vào, sau đó bớt đi.', 'MATH_WORD_PROBLEMS', 'ACTIVE', NULL, NULL),
	-- Child: 2.8. Trừ rồi cộng
	('MULTI_STEP_SUB_ADD', 'toan/lop-1', 'Trừ rồi cộng', 'Trước tiên bớt đi, sau đó thêm vào.', 'MATH_WORD_PROBLEMS', 'ACTIVE', NULL, NULL),
	-- Child: 5.5. Thay đổi liên tiếp
	('MULTI_STEP_SEQUENTIAL', 'toan/lop-1', 'Cộng trừ nhiều bước', 'Cộng trừ nhiều bước', 'MULTI_STEP', 'ACTIVE', NULL, NULL),
	-- Child: 5.6. Nhiều đối tượng
	('MULTI_STEP_MULTI_OBJECT', 'toan/lop-1', 'Nhiều đối tượng', 'Có nhiều người, vật hoặc nhóm cần theo dõi cùng lúc.', 'MULTI_STEP', 'ACTIVE', NULL, NULL),
	-- Child: 5.7. Chọn đúng thứ tự tính
	('MULTI_STEP_ORDER', 'toan/lop-1', 'Chọn đúng thứ tự tính', 'Phải xác định bước nào làm trước, bước nào làm sau.', 'MULTI_STEP', 'ACTIVE', NULL, NULL),
	-- Child: 5.8. Bài toán có dữ kiện thừa
	('MULTI_STEP_EXTRA_DATA', 'toan/lop-1', 'Bài toán có dữ kiện thừa', 'Có thông tin không cần dùng và phải biết bỏ qua.', 'MULTI_STEP', 'ACTIVE', NULL, NULL),

