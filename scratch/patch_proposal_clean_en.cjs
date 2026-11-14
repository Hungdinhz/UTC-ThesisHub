const fs = require('fs');
const path = require('path');

const targetFile = path.resolve('frontend/src/features/thesis/pages/ProposalManagementPage.tsx');
let content = fs.readFileSync(targetFile, 'utf8').replace(/\r\n/g, '\n');

// 1. Thay đổi QUICK_TEMPLATES (bỏ câu tiếng Anh)
const oldTmpl = `'Tên đề tài tiếng Anh cần tra cứu lại thuật ngữ chuyên ngành CNTT chuẩn xác.'`;
const newTmpl = `'Cần chuẩn hóa lại câu từ, quy cách trình bày và thuật ngữ chuyên ngành CNTT.'`;
if (content.includes(oldTmpl)) {
  content = content.replace(oldTmpl, newTmpl);
  console.log('[OK] Đã cập nhật QUICK_TEMPLATES');
}

// 2. Cập nhật getStatusBadge (bỏ tiếng Anh đi kèm)
const oldBadge = `      case 'APPROVED':
        return (
          <span style={{ padding: '4px 8px', borderRadius: '4px', background: '#e6f4ea', color: '#137333', fontWeight: 'bold' }}>
            ✓ ĐÃ DUYỆT (APPROVED)
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span style={{ padding: '4px 8px', borderRadius: '4px', background: '#e8f0fe', color: '#1a73e8', fontWeight: 'bold' }}>
            ⏳ CHỜ KHOA DUYỆT
          </span>
        );
      case 'SUBMITTED':
        return (
          <span style={{ padding: '4px 8px', borderRadius: '4px', background: '#fef7e0', color: '#b06000', fontWeight: 'bold' }}>
            📤 CHỜ GVHD XÁC NHẬN
          </span>
        );
      case 'REVISE_REQUIRED':
        return (
          <span style={{ padding: '4px 8px', borderRadius: '4px', background: '#fce8e6', color: '#c5221f', fontWeight: 'bold' }}>
            ⚠ CẦN SỬA ĐỔI
          </span>
        );
      case 'REJECTED':
        return (
          <span style={{ padding: '4px 8px', borderRadius: '4px', background: '#fee2e2', color: '#991b1b', fontWeight: 'bold' }}>
            ✕ TỪ CHỐI (REJECTED)
          </span>
        );`;

const newBadge = `      case 'APPROVED':
        return (
          <span style={{ padding: '4px 8px', borderRadius: '4px', background: '#e6f4ea', color: '#137333', fontWeight: 'bold' }}>
            ✓ ĐÃ PHÊ DUYỆT
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span style={{ padding: '4px 8px', borderRadius: '4px', background: '#e8f0fe', color: '#1a73e8', fontWeight: 'bold' }}>
            ⏳ CHỜ KHOA DUYỆT
          </span>
        );
      case 'SUBMITTED':
        return (
          <span style={{ padding: '4px 8px', borderRadius: '4px', background: '#fef7e0', color: '#b06000', fontWeight: 'bold' }}>
            📤 CHỜ GVHD DUYỆT
          </span>
        );
      case 'REVISE_REQUIRED':
        return (
          <span style={{ padding: '4px 8px', borderRadius: '4px', background: '#fce8e6', color: '#c5221f', fontWeight: 'bold' }}>
            ⚠ YÊU CẦU SỬA ĐỔI
          </span>
        );
      case 'REJECTED':
        return (
          <span style={{ padding: '4px 8px', borderRadius: '4px', background: '#fee2e2', color: '#991b1b', fontWeight: 'bold' }}>
            ✕ ĐÃ TỪ CHỐI
          </span>
        );`;

if (content.includes(oldBadge)) {
  content = content.replace(oldBadge, newBadge);
  console.log('[OK] Đã cập nhật getStatusBadge (bỏ tiếng Anh)');
}

// 3. Cập nhật dropdown filterStatus (bỏ tiếng Anh đi kèm)
const oldFilter = `          <option value="ALL">Tất cả trạng thái</option>
          <option value="DRAFT">Bản nháp (DRAFT)</option>
          <option value="SUBMITTED">Đã nộp - Chờ GVHD (SUBMITTED)</option>
          <option value="UNDER_REVIEW">Chờ Khoa/Ban duyệt (UNDER_REVIEW)</option>
          <option value="APPROVED">Đã phê duyệt (APPROVED)</option>
          <option value="REVISE_REQUIRED">Yêu cầu sửa đổi (REVISE)</option>
          <option value="REJECTED">Từ chối (REJECTED)</option>`;

const newFilter = `          <option value="ALL">Tất cả trạng thái</option>
          <option value="DRAFT">Bản nháp</option>
          <option value="SUBMITTED">Đã nộp - Chờ GVHD duyệt</option>
          <option value="UNDER_REVIEW">Chờ Khoa/Ban phê duyệt</option>
          <option value="APPROVED">Đã phê duyệt</option>
          <option value="REVISE_REQUIRED">Yêu cầu sửa đổi</option>
          <option value="REJECTED">Đã từ chối</option>`;

if (content.includes(oldFilter)) {
  content = content.replace(oldFilter, newFilter);
  console.log('[OK] Đã cập nhật dropdown filterStatus (bỏ tiếng Anh)');
}

// 4. Bỏ ô nhập Tên đề tài (Tiếng Anh) trong form nộp / sửa đề cương
const oldTitleEnField = `              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Tên đề tài (Tiếng Anh)</label>
                <input
                  type="text"
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                />
              </div>`;

if (content.includes(oldTitleEnField)) {
  content = content.replace(oldTitleEnField, '');
  console.log('[OK] Đã loại bỏ ô nhập Tên đề tài (Tiếng Anh) khỏi form đề cương');
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log('[SUCCESS] Hoàn thành cập nhật ProposalManagementPage.tsx!');

