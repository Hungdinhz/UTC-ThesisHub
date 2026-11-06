-- V430: Cập nhật tổng tín chỉ chương trình đào tạo (Cử nhân: 142 TC, Kỹ sư: 180 TC)
-- và điều chỉnh quy chế nợ tối đa 10 tín chỉ (<= 10 TC) vẫn đủ điều kiện xét làm đồ án, bỏ xét nợ môn tiên quyết.

UPDATE training_programs
SET total_credits = 142,
    description = 'Chương trình đào tạo Cử nhân chuẩn 4 năm (142 tín chỉ)'
WHERE code = 'CU_NHAN';

UPDATE training_programs
SET total_credits = 180,
    description = 'Chương trình đào tạo Kỹ sư chuyên sâu 4.5 - 5 năm (180 tín chỉ)'
WHERE code = 'KY_SU';

UPDATE academic_records
SET missing_prerequisite_count = 0
WHERE missing_prerequisite_count IS NOT NULL AND missing_prerequisite_count > 0;
