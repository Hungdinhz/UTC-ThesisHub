-- V429: Vô hiệu hóa tài khoản sinh viên không đủ điều kiện nhận đồ án (INELIGIBLE)
-- Quy định UTC: Sinh viên ở trạng thái không đủ điều kiện (nợ học phí, kỷ luật, nợ tín >= 10, GPA < 2.0) sẽ không được cấp tài khoản hệ thống.

UPDATE users u
SET is_active = false
WHERE u.id IN (
    SELECT s.user_id
    FROM student_project_rounds spr
    JOIN students s ON spr.student_id = s.id
    WHERE spr.status = 'INELIGIBLE'
      AND s.user_id IS NOT NULL
      -- Chỉ khóa nếu sinh viên không tham gia đợt nào khác đang đủ điều kiện
      AND NOT EXISTS (
          SELECT 1 
          FROM student_project_rounds spr2
          WHERE spr2.student_id = s.id
            AND spr2.status IN ('ELIGIBLE', 'FORCE_APPROVED', 'REGISTERED', 'ASSIGNED', 'IN_PROGRESS', 'DEFENDED')
      )
);

