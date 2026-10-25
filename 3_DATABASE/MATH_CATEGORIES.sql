
INSERT INTO MATH_CATEGORIES (CATEGORY_CODE, FULL_PATH, CATEGORY_NAME, CATEGORY_DESC, PARENT_CODE, STATUS, CREATED_AT, UPDATED_AT) VALUES
	-- Parent: 1. Làm quen với số
	('NUMBER_BASIC', 'toan/lop-1', '1. Làm quen với số', 'Học sinh nhận biết số, hiểu vị trí của số và biết so sánh các số.', NULL, 'ACTIVE', NULL, NULL),
	-- Parent: 2. Dãy số và tìm quy luật
	('NUMBER_PATTERN', 'toan/lop-1', '2. Dãy số và tìm quy luật', 'Nhìn vào nhiều số và phát hiện chúng đang thay đổi theo quy luật nào.', NULL, 'ACTIVE', NULL, NULL),
	-- Parent: 3. Cộng, trừ và điền số
	('CALCULATION', 'toan/lop-1', '3. Cộng, trừ và điền số', 'Rèn khả năng thực hiện phép tính và hiểu mối quan hệ giữa các số.', NULL, 'ACTIVE', NULL, NULL),
	-- Parent: 4. Tìm số chưa biết
	('UNKNOWN_NUMBER', 'toan/lop-1', '4. Tìm số chưa biết', 'Không cho trực tiếp số cần tìm mà phải suy nghĩ từ các dữ kiện để tìm ra số đó.', NULL, 'ACTIVE', NULL, NULL),
	-- Parent: 5. Bài toán nhiều bước
	('MULTI_STEP', 'toan/lop-1', '5. Bài toán nhiều bước', 'Một bài toán không thể giải ngay bằng một phép tính mà cần làm từng bước.', NULL, 'ACTIVE', NULL, NULL),
	-- Parent: 9. Đo lường và thời gian
	('MEASUREMENT_TIME', 'toan/lop-1', '9. Đo lường và thời gian', 'Nhận biết, so sánh và giải các bài toán về độ dài, thời gian, ngày tháng và tiền.', NULL, 'ACTIVE', NULL, NULL),
	-- Parent: 10. Tư duy tổng hợp
	('COMPREHENSIVE', 'toan/lop-1', '10. Tư duy tổng hợp', 'Kết hợp nhiều kỹ năng toán học và tư duy đã học để giải quyết bài toán.', NULL, 'ACTIVE', NULL, NULL),

	-- Child: 1.1. Nhận biết số
	('NUMBER_BASIC_RECOGNIZE', 'toan/lop-1', 'Nhận biết số', 'Nhìn vào số và xác định đó là số nào.', 'NUMBER_BASIC', 'ACTIVE', NULL, NULL),
	-- Child: 1.2. Đọc và viết số
	('NUMBER_BASIC_READ_WRITE', 'toan/lop-1', 'Đọc và viết số', 'Đọc số bằng lời và viết số theo yêu cầu.', 'NUMBER_BASIC', 'ACTIVE', NULL, NULL),
	-- Child: 1.3. Số đứng trước
	('NUMBER_BASIC_PREVIOUS', 'toan/lop-1', 'Số đứng trước', 'Tìm số đứng ngay trước một số đã cho.', 'NUMBER_BASIC', 'ACTIVE', NULL, NULL),
	-- Child: 1.4. Số đứng sau
	('NUMBER_BASIC_NEXT', 'toan/lop-1', 'Số đứng sau', 'Tìm số đứng ngay sau một số đã cho.', 'NUMBER_BASIC', 'ACTIVE', NULL, NULL),
	-- Child: 1.5. Số liền trước – số liền sau
	('NUMBER_BASIC_ADJACENT', 'toan/lop-1', 'Số liền trước – số liền sau', 'Xác định hai số ngay trước và ngay sau một số.', 'NUMBER_BASIC', 'ACTIVE', NULL, NULL),
	-- Child: 1.6. So sánh hai số
	('NUMBER_BASIC_COMPARE', 'toan/lop-1', 'So sánh hai số', 'Xác định số nào lớn hơn, nhỏ hơn hoặc hai số bằng nhau.', 'NUMBER_BASIC', 'ACTIVE', NULL, NULL),
	-- Child: 1.7. Tìm số lớn nhất – nhỏ nhất
	('NUMBER_BASIC_MAX_MIN', 'toan/lop-1', 'Tìm số lớn nhất – nhỏ nhất', 'Chọn số lớn nhất hoặc nhỏ nhất trong một nhóm số.', 'NUMBER_BASIC', 'ACTIVE', NULL, NULL),
	-- Child: 1.8. Sắp xếp các số
	('NUMBER_BASIC_SORT', 'toan/lop-1', 'Sắp xếp các số', 'Sắp xếp các số từ bé đến lớn hoặc từ lớn đến bé.', 'NUMBER_BASIC', 'ACTIVE', NULL, NULL),
	-- Child: 1.9. Tìm số ở giữa
	('NUMBER_BASIC_MIDDLE', 'toan/lop-1', 'Tìm số ở giữa', 'Tìm số nằm giữa hai số hoặc một nhóm số.', 'NUMBER_BASIC', 'ACTIVE', NULL, NULL),
	-- Child: 1.10. Số chẵn – số lẻ
	('NUMBER_BASIC_EVEN_ODD', 'toan/lop-1', 'Số chẵn – số lẻ', 'Nhận biết và phân loại số chẵn, số lẻ.', 'NUMBER_BASIC', 'ACTIVE', NULL, NULL),


	-- Child: 2.1. Dãy số tăng đều
	('NUMBER_PATTERN_ADD_EQUAL', 'toan/lop-1', 'Dãy số tăng đều', 'Mỗi lần tăng thêm cùng một số.', 'NUMBER_PATTERN', 'ACTIVE', NULL, NULL),
	-- Child: 2.2. Dãy số tăng không đều
	('NUMBER_PATTERN_INCREASING', 'toan/lop-1', 'Dãy số tăng không đều', 'Các số lần lượt lớn dần.', 'NUMBER_PATTERN', 'ACTIVE', NULL, NULL),
	-- Child: 2.3. Dãy số giảm đều
	('NUMBER_PATTERN_SUB_EQUAL', 'toan/lop-1', 'Dãy số giảm đều', 'Mỗi lần giảm đi cùng một số.', 'NUMBER_PATTERN', 'ACTIVE', NULL, NULL),
	-- Child: 2.4. Dãy số giảm không đều
	('NUMBER_PATTERN_DECREASING', 'toan/lop-1', 'Dãy số giảm không đều', 'Các số lần lượt nhỏ dần.', 'NUMBER_PATTERN', 'ACTIVE', NULL, NULL),
	-- Child: 2.5. Dãy số tăng – giảm xen kẽ
	('NUMBER_PATTERN_ALTERNATE', 'toan/lop-1', 'Dãy số tăng – giảm xen kẽ', 'Các số thay đổi theo hai quy luật luân phiên.', 'NUMBER_PATTERN', 'ACTIVE', NULL, NULL),
	-- Child: 2.6. Dãy số lặp lại
	('NUMBER_PATTERN_REPEAT', 'toan/lop-1', 'Dãy số lặp lại', 'Một nhóm số hoặc quy luật được lặp đi lặp lại.', 'NUMBER_PATTERN', 'ACTIVE', NULL, NULL),
	-- Child: 2.7. Tìm số còn thiếu
	('NUMBER_PATTERN_MISSING', 'toan/lop-1', 'Tìm số còn thiếu', 'Tìm số bị thiếu ở giữa một dãy số.', 'NUMBER_PATTERN', 'ACTIVE', NULL, NULL),

	-- Child: 3.1. Phép cộng
	('CALCULATION_ADDITION', 'toan/lop-1', 'Phép cộng', 'Tính tổng của hai hoặc nhiều số.', 'CALCULATION', 'ACTIVE', NULL, NULL),
	-- Child: 3.2. Phép trừ
	('CALCULATION_SUBTRACTION', 'toan/lop-1', 'Phép trừ', 'Tính phần còn lại sau khi bớt đi.', 'CALCULATION', 'ACTIVE', NULL, NULL),
	-- Child: 3.3. Tìm số bị trừ
	('CALCULATION_MINUEND', 'toan/lop-1', 'Tìm số bị trừ', 'Biết hiệu và số trừ, tìm số ban đầu.', 'CALCULATION', 'ACTIVE', NULL, NULL),
	-- Child: 3.4. Tìm số trừ
	('CALCULATION_SUBTRAHEND', 'toan/lop-1', 'Tìm số trừ', 'Biết số bị trừ và hiệu, tìm số đã bớt.', 'CALCULATION', 'ACTIVE', NULL, NULL),
	-- Child: 3.5. Điền dấu + hoặc −
	('CALCULATION_OPERATOR', 'toan/lop-1', 'Điền dấu + hoặc −', 'Chọn phép tính phù hợp để hoàn thành bài.', 'CALCULATION', 'ACTIVE', NULL, NULL),
	-- Child: 3.6. So sánh kết quả
	('CALCULATION_COMPARE', 'toan/lop-1', 'So sánh kết quả', 'Tính hoặc suy luận để biết phép tính nào lớn hơn, nhỏ hơn hoặc bằng nhau.', 'CALCULATION', 'ACTIVE', NULL, NULL),

	-- Child: 4.1. Tìm số qua nhiều phép tính
	('UNKNOWN_NUMBER_MULTI_CALC', 'toan/lop-1', 'Tìm số qua nhiều phép tính', 'Cần thực hiện từ hai phép tính trở lên để tìm số.', 'UNKNOWN_NUMBER', 'ACTIVE', NULL, NULL),
	-- Child: 4.2. Tìm hai số khi biết tổng và hiệu
	('UNKNOWN_NUMBER_SUM_DIFFERENCE', 'toan/lop-1', 'Tìm hai số khi biết tổng và hiệu', 'Biết tổng và hiệu của hai số, tìm hai số đó.', 'UNKNOWN_NUMBER', 'ACTIVE', NULL, NULL),
	-- Child: 4.3. Tìm hai số khi biết tổng và hiệu qua biểu thức
	('UNKNOWN_NUMBER_SUM_DIFFERENCE_CALC', 'toan/lop-1', 'Tìm hai số khi biết tổng và hiệu qua biểu thức', 'Tính tổng hoặc hiệu từ biểu thức đã cho, sau đó tìm hai số.', 'UNKNOWN_NUMBER', 'ACTIVE', NULL, NULL),

	-- Child: 5.1. Hai bước cộng
	('MULTI_STEP_ADD_ADD', 'toan/lop-1', 'Hai bước cộng', 'Thực hiện hai lần thêm vào.', 'MULTI_STEP', 'ACTIVE', NULL, NULL),
	-- Child: 5.2. Hai bước trừ
	('MULTI_STEP_SUB_SUB', 'toan/lop-1', 'Hai bước trừ', 'Thực hiện hai lần bớt đi.', 'MULTI_STEP', 'ACTIVE', NULL, NULL),
	-- Child: 5.3. Cộng rồi trừ
	('MULTI_STEP_ADD_SUB', 'toan/lop-1', 'Cộng rồi trừ', 'Trước tiên thêm vào, sau đó bớt đi.', 'MULTI_STEP', 'ACTIVE', NULL, NULL),
	-- Child: 5.4. Trừ rồi cộng
	('MULTI_STEP_SUB_ADD', 'toan/lop-1', 'Trừ rồi cộng', 'Trước tiên bớt đi, sau đó thêm vào.', 'MULTI_STEP', 'ACTIVE', NULL, NULL),
	-- Child: 5.5. Thay đổi liên tiếp
	('MULTI_STEP_SEQUENTIAL', 'toan/lop-1', 'Cộng trừ nhiều bước', 'Cộng trừ nhiều bước', 'MULTI_STEP', 'ACTIVE', NULL, NULL),
	-- Child: 5.6. Nhiều đối tượng
	('MULTI_STEP_MULTI_OBJECT', 'toan/lop-1', 'Nhiều đối tượng', 'Có nhiều người, vật hoặc nhóm cần theo dõi cùng lúc.', 'MULTI_STEP', 'ACTIVE', NULL, NULL),
	-- Child: 5.7. Chọn đúng thứ tự tính
	('MULTI_STEP_ORDER', 'toan/lop-1', 'Chọn đúng thứ tự tính', 'Phải xác định bước nào làm trước, bước nào làm sau.', 'MULTI_STEP', 'ACTIVE', NULL, NULL),
	-- Child: 5.8. Bài toán có dữ kiện thừa
	('MULTI_STEP_EXTRA_DATA', 'toan/lop-1', 'Bài toán có dữ kiện thừa', 'Có thông tin không cần dùng và phải biết bỏ qua.', 'MULTI_STEP', 'ACTIVE', NULL, NULL),


	-- Child: 10.1. Nhận biết giờ
	('TIME_READ_CLOCK', 'toan/lop-1', 'Nhận biết giờ', 'Đọc giờ trên đồng hồ và xác định thời điểm.', 'MEASUREMENT_TIME', 'ACTIVE', NULL, NULL),
	-- Child: 10.2. Tính thời gian
	('TIME_CALCULATION', 'toan/lop-1', 'Tính thời gian', 'Xác định thời điểm trước, sau hoặc khoảng thời gian đơn giản.', 'MEASUREMENT_TIME', 'ACTIVE', NULL, NULL),
	-- Child: 10.3. Ngày trong tuần
	('TIME_DAY_OF_WEEK', 'toan/lop-1', 'Ngày trong tuần', 'Xác định thứ, ngày trước hoặc ngày sau.', 'MEASUREMENT_TIME', 'ACTIVE', NULL, NULL),
	-- Child: 10.4. Ngày và tháng
	('TIME_DATE_MONTH', 'toan/lop-1', 'Ngày và tháng', 'Nhận biết và xác định ngày, tháng theo lịch.', 'MEASUREMENT_TIME', 'ACTIVE', NULL, NULL),
	-- Child: 10.5. Bài toán về thời gian
	('TIME_WORD_PROBLEM', 'toan/lop-1', 'Bài toán về thời gian', 'Giải bài toán thực tế có liên quan đến giờ, ngày hoặc khoảng thời gian.', 'MEASUREMENT_TIME', 'ACTIVE', NULL, NULL);