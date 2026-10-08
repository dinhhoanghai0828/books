
INSERT INTO MATH_CATEGORIES (CATEGORY_CODE, FULL_PATH, CATEGORY_NAME, CATEGORY_DESC, PARENT_CODE, STATUS, CREATED_AT, UPDATED_AT) VALUES
	-- Parent: 1. Làm quen với số
	('NUMBER_BASIC', 'toan/lop-1', 'Làm quen với số', 'Học sinh nhận biết số, hiểu vị trí của số và biết so sánh các số.', NULL, 'ACTIVE', NULL, NULL),
	-- Parent: 2. Dãy số và tìm quy luật
	('NUMBER_PATTERN', 'toan/lop-1', 'Dãy số và tìm quy luật', 'Nhìn vào nhiều số và phát hiện chúng đang thay đổi theo quy luật nào.', NULL, 'ACTIVE', NULL, NULL),
	-- Parent: 3. Cộng, trừ và điền số
	('CALCULATION', 'toan/lop-1', 'Cộng, trừ và điền số', 'Rèn khả năng thực hiện phép tính và hiểu mối quan hệ giữa các số.', NULL, 'ACTIVE', NULL, NULL),
	-- Parent: 4. Tìm số chưa biết
	('UNKNOWN_NUMBER', 'toan/lop-1', 'Tìm số chưa biết', 'Không cho trực tiếp số cần tìm mà phải suy nghĩ từ các dữ kiện để tìm ra số đó.', NULL, 'ACTIVE', NULL, NULL),
	-- Parent: 5. Bài toán có lời văn – một bước
	('WORD_PROBLEM', 'toan/lop-1', 'Bài toán có lời văn – một bước', 'Đọc câu chuyện ngắn, hiểu tình huống, chọn phép tính và tìm đáp án.', NULL, 'ACTIVE', NULL, NULL),
	-- Parent: 6. Bài toán nhiều bước
	('MULTI_STEP', 'toan/lop-1', 'Bài toán nhiều bước', 'Một bài toán không thể giải ngay bằng một phép tính mà cần làm từng bước.', NULL, 'ACTIVE', NULL, NULL),
	-- Parent: 7. Suy luận logic
	('LOGIC', 'toan/lop-1', 'Suy luận logic', 'Không chỉ tính toán mà phải suy nghĩ từ thông tin được cho.', NULL, 'ACTIVE', NULL, NULL),
	-- Parent: 8. Tìm đáp án theo nhiều điều kiện
	('CONDITION', 'toan/lop-1', 'Tìm đáp án theo nhiều điều kiện', 'Một đáp án phải đúng cùng lúc với nhiều yêu cầu.', NULL, 'ACTIVE', NULL, NULL),
	-- Parent: 9. Chắc chắn – có thể – không thể
	('POSSIBILITY', 'toan/lop-1', 'Chắc chắn – có thể – không thể', 'Phân biệt điều gì chắc chắn xảy ra, có thể xảy ra và không thể xảy ra.', NULL, 'ACTIVE', NULL, NULL),
	-- Parent: 10. Đo lường và thời gian
	('MEASUREMENT_TIME', 'toan/lop-1', 'Đo lường và thời gian', 'Nhận biết, so sánh và giải các bài toán về độ dài, thời gian, ngày tháng và tiền.', NULL, 'ACTIVE', NULL, NULL),
	-- Parent: 11. Tư duy tổng hợp
	('COMPREHENSIVE', 'toan/lop-1', 'Tư duy tổng hợp', 'Kết hợp nhiều kỹ năng toán học và tư duy đã học để giải quyết bài toán.', NULL, 'ACTIVE', NULL, NULL),

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
	-- Child: 2.8. Tìm quy luật của dãy
	('NUMBER_PATTERN_RULE', 'toan/lop-1', 'Tìm quy luật của dãy', 'Quan sát các số và nói được chúng thay đổi như thế nào.', 'NUMBER_PATTERN', 'ACTIVE', NULL, NULL),
	-- Child: 2.9. Tìm số sai
	('NUMBER_PATTERN_WRONG', 'toan/lop-1', 'Tìm số sai', 'Phát hiện một số không tuân theo quy luật của cả dãy.', 'NUMBER_PATTERN', 'ACTIVE', NULL, NULL),

	-- Child: 3.1. Phép cộng
	('CALCULATION_ADDITION', 'toan/lop-1', 'Phép cộng', 'Tính tổng của hai hoặc nhiều số.', 'CALCULATION', 'ACTIVE', NULL, NULL),
	-- Child: 3.2. Phép trừ
	('CALCULATION_SUBTRACTION', 'toan/lop-1', 'Phép trừ', 'Tính phần còn lại sau khi bớt đi.', 'CALCULATION', 'ACTIVE', NULL, NULL),
	-- Child: 3.3. Tìm kết quả
	('CALCULATION_RESULT', 'toan/lop-1', 'Tìm kết quả', 'Cho phép tính và tìm kết quả đúng.', 'CALCULATION', 'ACTIVE', NULL, NULL),
	-- Child: 3.4. Tìm số còn thiếu
	('CALCULATION_MISSING', 'toan/lop-1', 'Tìm số còn thiếu', 'Tìm số còn thiếu trong phép cộng hoặc phép trừ.', 'CALCULATION', 'ACTIVE', NULL, NULL),
	-- Child: 3.5. Tìm số hạng chưa biết
	('CALCULATION_UNKNOWN_ADDEND', 'toan/lop-1', 'Tìm số hạng chưa biết', 'Biết tổng và một số, tìm số còn lại.', 'CALCULATION', 'ACTIVE', NULL, NULL),
	-- Child: 3.6. Tìm số bị trừ
	('CALCULATION_MINUEND', 'toan/lop-1', 'Tìm số bị trừ', 'Biết hiệu và số trừ, tìm số ban đầu.', 'CALCULATION', 'ACTIVE', NULL, NULL),
	-- Child: 3.7. Tìm số trừ
	('CALCULATION_SUBTRAHEND', 'toan/lop-1', 'Tìm số trừ', 'Biết số bị trừ và hiệu, tìm số đã bớt.', 'CALCULATION', 'ACTIVE', NULL, NULL),
	-- Child: 3.8. Điền dấu + hoặc −
	('CALCULATION_OPERATOR', 'toan/lop-1', 'Điền dấu + hoặc −', 'Chọn phép tính phù hợp để hoàn thành bài.', 'CALCULATION', 'ACTIVE', NULL, NULL),
	-- Child: 3.9. So sánh kết quả
	('CALCULATION_COMPARE', 'toan/lop-1', 'So sánh kết quả', 'Tính hoặc suy luận để biết phép tính nào lớn hơn, nhỏ hơn hoặc bằng nhau.', 'CALCULATION', 'ACTIVE', NULL, NULL),

	-- Child: 4.1. Tìm số khi biết tổng
	('UNKNOWN_NUMBER_SUM', 'toan/lop-1', 'Tìm số khi biết tổng', 'Biết tổng và một phần, tìm phần còn lại.', 'UNKNOWN_NUMBER', 'ACTIVE', NULL, NULL),
	-- Child: 4.2. Tìm số khi biết hiệu
	('UNKNOWN_NUMBER_DIFFERENCE', 'toan/lop-1', 'Tìm số khi biết hiệu', 'Biết sự chênh lệch và một số, tìm số còn lại.', 'UNKNOWN_NUMBER', 'ACTIVE', NULL, NULL),
	-- Child: 4.3. Tìm số lớn hơn
	('UNKNOWN_NUMBER_GREATER', 'toan/lop-1', 'Tìm số lớn hơn', 'Biết một số và số còn lại lớn hơn bao nhiêu.', 'UNKNOWN_NUMBER', 'ACTIVE', NULL, NULL),
	-- Child: 4.4. Tìm số nhỏ hơn
	('UNKNOWN_NUMBER_SMALLER', 'toan/lop-1', 'Tìm số nhỏ hơn', 'Biết một số và số còn lại nhỏ hơn bao nhiêu.', 'UNKNOWN_NUMBER', 'ACTIVE', NULL, NULL),
	-- Child: 4.5. Tìm số trong sơ đồ
	('UNKNOWN_NUMBER_DIAGRAM', 'toan/lop-1', 'Tìm số trong sơ đồ', 'Tìm số còn thiếu trong sơ đồ hoặc mối quan hệ giữa các số.', 'UNKNOWN_NUMBER', 'ACTIVE', NULL, NULL),
	-- Child: 4.6. Tìm số qua nhiều phép tính
	('UNKNOWN_NUMBER_MULTI_CALC', 'toan/lop-1', 'Tìm số qua nhiều phép tính', 'Cần thực hiện từ hai phép tính trở lên để tìm số.', 'UNKNOWN_NUMBER', 'ACTIVE', NULL, NULL),
	-- Child: 4.7. Tìm số theo điều kiện
	('UNKNOWN_NUMBER_CONDITION', 'toan/lop-1', 'Tìm số theo điều kiện', 'Tìm số đáp ứng một hoặc nhiều yêu cầu.', 'UNKNOWN_NUMBER', 'ACTIVE', NULL, NULL),
	
	-- Child: 5.1. Thêm vào
	('WORD_PROBLEM_ADD', 'toan/lop-1', 'Thêm vào', 'Có một số đồ vật, sau đó được thêm vào.', 'WORD_PROBLEM', 'ACTIVE', NULL, NULL),
	-- Child: 5.2. Bớt đi
	('WORD_PROBLEM_SUBTRACT', 'toan/lop-1', 'Bớt đi', 'Có một số đồ vật, sau đó bị lấy đi hoặc bớt đi.', 'WORD_PROBLEM', 'ACTIVE', NULL, NULL),
	-- Child: 5.3. Tìm tất cả
	('WORD_PROBLEM_TOTAL', 'toan/lop-1', 'Tìm tất cả', 'Biết hai phần và cần tìm tổng số.', 'WORD_PROBLEM', 'ACTIVE', NULL, NULL),
	-- Child: 5.4. Tìm phần còn lại
	('WORD_PROBLEM_REMAINING', 'toan/lop-1', 'Tìm phần còn lại', 'Biết tổng số và phần đã lấy đi, tìm phần còn lại.', 'WORD_PROBLEM', 'ACTIVE', NULL, NULL),
	-- Child: 5.5. So sánh hơn
	('WORD_PROBLEM_MORE', 'toan/lop-1', 'So sánh hơn', 'Một đối tượng nhiều hơn đối tượng khác bao nhiêu.', 'WORD_PROBLEM', 'ACTIVE', NULL, NULL),
	-- Child: 5.6. So sánh kém
	('WORD_PROBLEM_LESS', 'toan/lop-1', 'So sánh kém', 'Một đối tượng ít hơn đối tượng khác bao nhiêu.', 'WORD_PROBLEM', 'ACTIVE', NULL, NULL),
	-- Child: 5.7. Nhiều hơn – ít hơn
	('WORD_PROBLEM_MORE_LESS', 'toan/lop-1', 'Nhiều hơn – ít hơn', 'Tìm số lượng khi biết mối quan hệ nhiều hơn hoặc ít hơn.', 'WORD_PROBLEM', 'ACTIVE', NULL, NULL),
	-- Child: 5.8. Chọn phép tính đúng
	('WORD_PROBLEM_OPERATOR', 'toan/lop-1', 'Chọn phép tính đúng', 'Đọc bài toán và xác định nên dùng cộng hay trừ.', 'WORD_PROBLEM', 'ACTIVE', NULL, NULL),

	-- Child: 6.1. Hai bước cộng
	('MULTI_STEP_ADD_ADD', 'toan/lop-1', 'Hai bước cộng', 'Thực hiện hai lần thêm vào.', 'MULTI_STEP', 'ACTIVE', NULL, NULL),
	-- Child: 6.2. Hai bước trừ
	('MULTI_STEP_SUB_SUB', 'toan/lop-1', 'Hai bước trừ', 'Thực hiện hai lần bớt đi.', 'MULTI_STEP', 'ACTIVE', NULL, NULL),
	-- Child: 6.3. Cộng rồi trừ
	('MULTI_STEP_ADD_SUB', 'toan/lop-1', 'Cộng rồi trừ', 'Trước tiên thêm vào, sau đó bớt đi.', 'MULTI_STEP', 'ACTIVE', NULL, NULL),
	-- Child: 6.4. Trừ rồi cộng
	('MULTI_STEP_SUB_ADD', 'toan/lop-1', 'Trừ rồi cộng', 'Trước tiên bớt đi, sau đó thêm vào.', 'MULTI_STEP', 'ACTIVE', NULL, NULL),
	-- Child: 6.5. Thay đổi liên tiếp
	('MULTI_STEP_SEQUENTIAL', 'toan/lop-1', 'Cộng trừ nhiều bước', 'Cộng trừ nhiều bước', 'MULTI_STEP', 'ACTIVE', NULL, NULL),
	-- Child: 6.6. Nhiều đối tượng
	('MULTI_STEP_MULTI_OBJECT', 'toan/lop-1', 'Nhiều đối tượng', 'Có nhiều người, vật hoặc nhóm cần theo dõi cùng lúc.', 'MULTI_STEP', 'ACTIVE', NULL, NULL),
	-- Child: 6.7. Chọn đúng thứ tự tính
	('MULTI_STEP_ORDER', 'toan/lop-1', 'Chọn đúng thứ tự tính', 'Phải xác định bước nào làm trước, bước nào làm sau.', 'MULTI_STEP', 'ACTIVE', NULL, NULL),
	-- Child: 6.8. Bài toán có dữ kiện thừa
	('MULTI_STEP_EXTRA_DATA', 'toan/lop-1', 'Bài toán có dữ kiện thừa', 'Có thông tin không cần dùng và phải biết bỏ qua.', 'MULTI_STEP', 'ACTIVE', NULL, NULL),

	-- Child: 7.1. Đúng hay sai?
	('LOGIC_TRUE_FALSE', 'toan/lop-1', 'Đúng hay sai?', 'Đọc thông tin và xác định kết luận có đúng không.', 'LOGIC', 'ACTIVE', NULL, NULL),
	-- Child: 7.2. Ai nhiều hơn?
	('LOGIC_WHO_MORE', 'toan/lop-1', 'Ai nhiều hơn?', 'Dựa vào các thông tin để xác định đối tượng nào nhiều hơn.', 'LOGIC', 'ACTIVE', NULL, NULL),
	-- Child: 7.3. Ai ít hơn?
	('LOGIC_WHO_LESS', 'toan/lop-1', 'Ai ít hơn?', 'Tìm đối tượng có số lượng ít hơn.', 'LOGIC', 'ACTIVE', NULL, NULL),
	-- Child: 7.4. Ai đứng trước?
	('LOGIC_WHO_FIRST', 'toan/lop-1', 'Ai đứng trước?', 'Dựa vào các dữ kiện để xác định thứ tự.', 'LOGIC', 'ACTIVE', NULL, NULL),
	-- Child: 7.5. Ai đứng sau?
	('LOGIC_WHO_AFTER', 'toan/lop-1', 'Ai đứng sau?', 'Tìm vị trí của đối tượng dựa trên thông tin đã cho.', 'LOGIC', 'ACTIVE', NULL, NULL),
	-- Child: 7.6. Ai đứng ở giữa?
	('LOGIC_WHO_MIDDLE', 'toan/lop-1', 'Ai đứng ở giữa?', 'Xác định đối tượng nằm giữa hai đối tượng khác.', 'LOGIC', 'ACTIVE', NULL, NULL),
	-- Child: 7.7. Sắp xếp theo thứ tự
	('LOGIC_SORT', 'toan/lop-1', 'Sắp xếp theo thứ tự', 'Sắp xếp người hoặc đồ vật theo các dữ kiện.', 'LOGIC', 'ACTIVE', NULL, NULL),
	-- Child: 7.8. Ghép đúng
	('LOGIC_MATCH', 'toan/lop-1', 'Ghép đúng', 'Ghép người với đồ vật, số với nhóm hoặc các đối tượng có quan hệ với nhau.', 'LOGIC', 'ACTIVE', NULL, NULL),
	-- Child: 7.9. Phân loại
	('LOGIC_CLASSIFY', 'toan/lop-1', 'Phân loại', 'Chia các đối tượng thành những nhóm phù hợp.', 'LOGIC', 'ACTIVE', NULL, NULL),
	-- Child: 7.10. Loại trừ
	('LOGIC_ELIMINATION', 'toan/lop-1', 'Loại trừ', 'Loại bỏ những đáp án không thể xảy ra.', 'LOGIC', 'ACTIVE', NULL, NULL),
	-- Child: 7.11. Tìm đối tượng phù hợp
	('LOGIC_FIND_OBJECT', 'toan/lop-1', 'Tìm đối tượng phù hợp', 'Dựa vào các đặc điểm để tìm đúng đối tượng.', 'LOGIC', 'ACTIVE', NULL, NULL),

	-- Child: 8.1. Một điều kiện
	('CONDITION_ONE', 'toan/lop-1', 'Một điều kiện', 'Tìm đáp án phù hợp với một yêu cầu.', 'CONDITION', 'ACTIVE', NULL, NULL),
	-- Child: 8.2. Hai điều kiện
	('CONDITION_TWO', 'toan/lop-1', 'Hai điều kiện', 'Đáp án phải thỏa mãn hai yêu cầu cùng lúc.', 'CONDITION', 'ACTIVE', NULL, NULL),
	-- Child: 8.3. Ba điều kiện
	('CONDITION_THREE', 'toan/lop-1', 'Ba điều kiện', 'Đáp án phải thỏa mãn ba yêu cầu.', 'CONDITION', 'ACTIVE', NULL, NULL),
	-- Child: 8.4. Nhiều điều kiện kết hợp
	('CONDITION_COMBINATION', 'toan/lop-1', 'Nhiều điều kiện kết hợp, có thể là 4, 5, 6', 'Kết hợp nhiều yêu cầu trong cùng một bài.', 'CONDITION', 'ACTIVE', NULL, NULL),

	-- Child: 9.1. Chắc chắn đúng
	('POSSIBILITY_CERTAIN_TRUE', 'toan/lop-1', 'Chắc chắn đúng', 'Thông tin luôn đúng trong mọi trường hợp.', 'POSSIBILITY', 'ACTIVE', NULL, NULL),
	-- Child: 9.2. Chắc chắn sai
	('POSSIBILITY_CERTAIN_FALSE', 'toan/lop-1', 'Chắc chắn sai', 'Thông tin không thể đúng.', 'POSSIBILITY', 'ACTIVE', NULL, NULL),
	-- Child: 9.3. Có thể đúng
	('POSSIBILITY_POSSIBLE_TRUE', 'toan/lop-1', 'Có thể đúng', 'Thông tin có thể xảy ra nhưng không phải lúc nào cũng xảy ra.', 'POSSIBILITY', 'ACTIVE', NULL, NULL),
	-- Child: 9.4. Không thể xảy ra
	('POSSIBILITY_IMPOSSIBLE', 'toan/lop-1', 'Không thể xảy ra', 'Một tình huống không thể xảy ra dựa trên các dữ kiện.', 'POSSIBILITY', 'ACTIVE', NULL, NULL),
	-- Child: 9.5. Điều gì luôn đúng?
	('POSSIBILITY_ALWAYS_TRUE', 'toan/lop-1', 'Điều gì luôn đúng?', 'Tìm kết luận đúng trong mọi trường hợp.', 'POSSIBILITY', 'ACTIVE', NULL, NULL),
	
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