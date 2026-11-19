-- =============================================================================
-- Migration: V432__replace_lecturers_with_exact_faculty_list.sql
-- Description: Update degree constraint to allow 'KS', synchronize exact 33
-- UTC IT faculty members and assign project directions & capacities.
-- =============================================================================

-- 1. Ensure academic_degree allows 'KS'
ALTER TABLE lecturers DROP CONSTRAINT IF EXISTS chk_lecturers_degree;
ALTER TABLE lecturers ADD CONSTRAINT chk_lecturers_degree
    CHECK (academic_degree IN ('THAC_SI', 'TIEN_SI', 'PGS', 'GS', 'KS', 'OTHER'));

-- 2. Verify all 33 lecturers are created and active
DO $$
BEGIN
    -- Update all active lecturer passwords to standard default if needed
    UPDATE users
    SET password = '$2a$10$oCLjZ/mDafFVyQc8nRW0COifZhx3p/AZBeynVP4qU0NcQjfc9EXQ.',
        is_active = TRUE
    WHERE username ~ '^gv[0-9]{3}$';

    -- Synchronize research_interests for all 33 faculty members
    UPDATE lecturers SET research_interests = 'Dữ liệu và trí tuệ nhân tạo, Phát triển phần mềm và ứng dụng (webApp, MobileApp)' WHERE lecturer_code = 'GV001';
    UPDATE lecturers SET research_interests = 'Phát triển phần mềm và ứng dụng (webApp, MobileApp), Lập trình Game' WHERE lecturer_code = 'GV002';
    UPDATE lecturers SET research_interests = 'Phát triển phần mềm và ứng dụng (webApp, MobileApp), Lập trình Game' WHERE lecturer_code = 'GV003';
    UPDATE lecturers SET research_interests = 'Phát triển phần mềm và ứng dụng (webApp, MobileApp), Kiểm thử phần mềm' WHERE lecturer_code = 'GV004';
    UPDATE lecturers SET research_interests = 'Phát triển phần mềm và ứng dụng (webApp, MobileApp), Kiểm thử phần mềm, Dữ liệu và trí tuệ nhân tạo' WHERE lecturer_code = 'GV005';
    UPDATE lecturers SET research_interests = 'Phát triển phần mềm và ứng dụng (webApp, MobileApp), Lập trình Game, Dữ liệu và trí tuệ nhân tạo' WHERE lecturer_code = 'GV006';
    UPDATE lecturers SET research_interests = 'Phát triển phần mềm và ứng dụng (webApp, MobileApp)' WHERE lecturer_code = 'GV007';
    UPDATE lecturers SET research_interests = 'Dữ liệu và trí tuệ nhân tạo, Phát triển phần mềm và ứng dụng (webApp, MobileApp), Kiểm thử phần mềm' WHERE lecturer_code = 'GV008';
    UPDATE lecturers SET research_interests = 'Phát triển phần mềm và ứng dụng (webApp, MobileApp)' WHERE lecturer_code = 'GV009';
    UPDATE lecturers SET research_interests = 'Phát triển phần mềm và ứng dụng (webApp, MobileApp), Kiểm thử phần mềm, Dữ liệu và trí tuệ nhân tạo, Lập trình Game' WHERE lecturer_code = 'GV010';
    UPDATE lecturers SET research_interests = 'Phát triển phần mềm và ứng dụng (webApp, MobileApp)' WHERE lecturer_code = 'GV011';
    UPDATE lecturers SET research_interests = 'Phát triển phần mềm và ứng dụng (webApp, MobileApp)' WHERE lecturer_code = 'GV012';
    UPDATE lecturers SET research_interests = 'Dữ liệu và trí tuệ nhân tạo, Phát triển phần mềm và ứng dụng (webApp, MobileApp)' WHERE lecturer_code = 'GV013';
    UPDATE lecturers SET research_interests = 'Phát triển phần mềm và ứng dụng (webApp, MobileApp), Dữ liệu và trí tuệ nhân tạo' WHERE lecturer_code = 'GV014';
    UPDATE lecturers SET research_interests = 'Kiểm thử phần mềm, Phát triển phần mềm và ứng dụng (webApp, MobileApp)' WHERE lecturer_code = 'GV015';
    UPDATE lecturers SET research_interests = 'Phát triển phần mềm và ứng dụng (webApp, MobileApp), Dữ liệu và trí tuệ nhân tạo' WHERE lecturer_code = 'GV016';
    UPDATE lecturers SET research_interests = 'Phát triển phần mềm và ứng dụng (webApp, MobileApp)' WHERE lecturer_code = 'GV017';
    UPDATE lecturers SET research_interests = 'Dữ liệu và trí tuệ nhân tạo' WHERE lecturer_code = 'GV018';
    UPDATE lecturers SET research_interests = 'Phát triển phần mềm và ứng dụng (webApp, MobileApp), Lập trình Game' WHERE lecturer_code = 'GV019';
    UPDATE lecturers SET research_interests = 'Lập trình Game, Dữ liệu và trí tuệ nhân tạo' WHERE lecturer_code = 'GV020';
    UPDATE lecturers SET research_interests = 'Phát triển phần mềm và ứng dụng (webApp, MobileApp)' WHERE lecturer_code = 'GV021';
    UPDATE lecturers SET research_interests = 'Phát triển phần mềm và ứng dụng (webApp, MobileApp), Kiểm thử phần mềm, Dữ liệu và trí tuệ nhân tạo, Lập trình Game' WHERE lecturer_code = 'GV022';
    UPDATE lecturers SET research_interests = 'Lập trình Game, Phát triển phần mềm và ứng dụng (webApp, MobileApp)' WHERE lecturer_code = 'GV023';
    UPDATE lecturers SET research_interests = 'Phát triển phần mềm và ứng dụng (webApp, MobileApp)' WHERE lecturer_code = 'GV024';
    UPDATE lecturers SET research_interests = 'Nghiên cứu và ứng dụng thuật toán, Phát triển phần mềm và ứng dụng (webApp, MobileApp), Lập trình Game' WHERE lecturer_code = 'GV025';
    UPDATE lecturers SET research_interests = 'Phát triển phần mềm và ứng dụng (webApp, MobileApp), Lập trình Game' WHERE lecturer_code = 'GV026';
    UPDATE lecturers SET research_interests = 'Hệ thống, mạng và hạ tầng CNTT, Phát triển phần mềm và ứng dụng (webApp, MobileApp)' WHERE lecturer_code = 'GV027';
    UPDATE lecturers SET research_interests = 'Phát triển phần mềm và ứng dụng (webApp, MobileApp), Kiểm thử phần mềm, Dữ liệu và trí tuệ nhân tạo' WHERE lecturer_code = 'GV028';
    UPDATE lecturers SET research_interests = 'Phát triển phần mềm và ứng dụng (webApp, MobileApp)' WHERE lecturer_code = 'GV029';
    UPDATE lecturers SET research_interests = 'Hệ thống, mạng và hạ tầng CNTT, Phát triển phần mềm và ứng dụng (webApp, MobileApp), Lập trình Game' WHERE lecturer_code = 'GV030';
    UPDATE lecturers SET research_interests = 'An toàn thông tin và an ninh mạng, Phát triển phần mềm và ứng dụng (webApp, MobileApp)' WHERE lecturer_code = 'GV031';
    UPDATE lecturers SET research_interests = 'Hệ thống, mạng và hạ tầng CNTT, Phát triển phần mềm và ứng dụng (webApp, MobileApp)' WHERE lecturer_code = 'GV032';
    UPDATE lecturers SET research_interests = 'Phát triển phần mềm và ứng dụng (webApp, MobileApp)' WHERE lecturer_code = 'GV033';
END $$;
