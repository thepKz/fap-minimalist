# One-off: sanitize transrcipt_full.txt for public repo. Remove after use or keep.
import re

path = r"C:\Users\Admin\Documents\fap-fpt\fap-minimal-extension\scrawl\transrcipt_full.txt"
with open(path, "r", encoding="utf-8") as f:
    text = f.read()

pattern_h2 = re.compile(
    r'<h2>Grade report for transcipt\s+.*?<a class="btn btn-primary" id="btnReset"[^>]*>Reset</a></div></h2>',
    re.DOTALL,
)
replacement_h2 = """<h2>Grade report for transcript <span class=\"label label-muted\">(mẫu — đã ẩn điểm / môn / kỳ)</span>
        <span id=\"ctl00_mainContent_lblRollNumber\"><span class=\"label label-default\">SE000000</span> - <span class=\"label label-info\">—</span></span>
        <span id=\"insert_div\"><null> - </null>
        <span class=\"label label-default\">GPA: —</span>
        <br><br>
        <h4 style=\"text-align: left; font-size: 16px;\">
        <span class=\"label label-default\" style=\"margin-right: 6px;\">Theo kỳ: —</span>
        </h4>
        </span>
        <div>
        <a class=\"btn\" disabled=\"\" style=\"margin-top: 5px;\">❌ Exclude (không tính các môn): </a>
        <input value=\"\" id=\"excludedSubjectCodes\" type=\"text\" onkeydown=\"return event.key != 'Enter';\" class=\"form-control\" style=\"width: calc(100% - 400px);display: inline;\" placeholder=\"Enter the SUBJECT CODEs to EXCLUDE from GPA calculation, separated by commas (,)\">
        <a class=\"btn btn-warning\" id=\"btnExclude\" style=\"margin-top: 5px;\">OK</a>
        <a class=\"btn btn-primary\" id=\"btnReset\" style=\"margin-top: 5px;\">Reset</a></div></h2>"""

if not pattern_h2.search(text):
    raise SystemExit("H2 block pattern not found")
text = pattern_h2.sub(replacement_h2, text, count=1)

pattern_tbody = re.compile(
    r'(</thead>\s*)<tbody><tr><td>1</td><td>0</td><td class="">Fall2022</td>.*?</tbody></table><table>',
    re.DOTALL,
)
placeholder_tbody = r"""\1<tbody><tr><td>1</td><td>0</td><td class="">—</td><td class="">XXX000</td><td style="width:60px"></td><td></td><td>[Đã ẩn]</td><td>3</td><td><span class="label label-primary">—</span></td><td><span class="label label-success">Passed</span></td><td></td></tr><tr><td>2</td><td>0</td><td class="">—</td><td class="">XXX000</td><td style="width:60px"></td><td></td><td>[Đã ẩn]</td><td>3</td><td><span class="label label-primary">—</span></td><td><span class="label label-success">Passed</span></td><td></td></tr><tr><td colspan="11"> <span style="Color:red;"><b>(*)</b></span><em> Môn điều kiện tốt nghiệp, không tính vào điểm trung bình tích lũy<em></em></em></td></tr></tbody></table><table>"""

if not pattern_tbody.search(text):
    raise SystemExit("Grade tbody pattern not found")
text = pattern_tbody.sub(placeholder_tbody, text, count=1)

text = text.replace(
    '<div id="ctl00_mainContent_divDNTN"><b>Tên đề tài tốt nghiệp:</b> Transparent Charity Fund Management System - Hệ Thống Quản Lý Quỹ Thiện Nguyện Minh Bạch</div>',
    '<div id="ctl00_mainContent_divDNTN"><b>Tên đề tài tốt nghiệp:</b> [Đã ẩn]</div>',
)

pattern_notgrade = re.compile(
    r'(<div id="ctl00_mainContent_divNotGrade"><table class="table table-hover"><thead class="thead-inverse">.*?</thead>\s*)<tbody>.*?</tbody></table>',
    re.DOTALL,
)
placeholder_ng = r"""\1<tbody><tr><td>1</td><td>—</td><td>XXX000</td><td>[Đã ẩn]</td><td>0</td><td><span style="font-weight: bold;">—</span></td><td><span class="label label-success">Passed</span></td></tr></tbody></table>"""

if not pattern_notgrade.search(text):
    raise SystemExit("divNotGrade pattern not found")
text = pattern_notgrade.sub(placeholder_ng, text, count=1)

with open(path, "w", encoding="utf-8", newline="\n") as f:
    f.write(text)
print("OK")
