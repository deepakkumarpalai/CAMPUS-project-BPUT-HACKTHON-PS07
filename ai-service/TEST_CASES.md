# AI-assisted priority test cases

Expected outputs are illustrative recommendations, not guaranteed decisions.
Reasons follow the returned context-aware rationale.

| # | Complaint | Expected category | Priority | Why |
|---|---|---|---|---|
| 1 | No water in hostel | Water Supply | CRITICAL | Essential service outage in a shared residence can affect many students. |
| 2 | Fan is not working in my room | Electrical | MEDIUM | Localized issue for one room; review for any added safety concern. |
| 3 | There is smoke coming from electrical board | Electrical | CRITICAL | Smoke near electrical equipment may indicate an immediate safety hazard. |
| 4 | Mess food is not good | Mess & Food | LOW | General food-quality concern without a reported immediate health impact. |
| 5 | Internet is slow in hostel | Wi-Fi & Internet | MEDIUM | Impacts campus access, but wording does not indicate a major outage. |
| 6 | Bathroom is dirty | Bathroom & Cleaning | MEDIUM | Shared sanitation issue; administrator should verify its extent. |
| 7 | Main gate security problem | Security | HIGH | Access-control concern at a campus entrance merits prompt review. |
| 8 | All hostel lights are not working | Electrical | HIGH | Broad outage affects a shared building and may create safety risks. |
| 9 | One classroom projector is not working | Classroom & Laboratory | MEDIUM | Localized classroom disruption without a stated safety hazard. |
| 10 | Gas smell is coming from hostel kitchen | Mess & Food | CRITICAL | Potential gas leak in a shared kitchen is a safety hazard. |
| 11 | No running water for every student in the entire residence since morning | Water Supply | CRITICAL | Broad and prolonged loss of an essential service. |
| 12 | A tap is dripping in my room | Water Supply | LOW | Localized maintenance issue with limited reported impact. |
| 13 | The fire exit is blocked in the academic building | Security | CRITICAL | A blocked emergency exit can prevent safe evacuation. |
| 14 | Several students are stranded because the college bus broke down | Transport | HIGH | Multiple students are affected and transport is disrupted. |
| 15 | A broken chair in one classroom | Maintenance | LOW | Minor, localized maintenance issue absent a stated injury hazard. |
| 16 | The hostel WiFi is unavailable for all residents | Wi-Fi & Internet | HIGH | Broad outage disrupts online campus access for residents. |
| 17 | Sewage is overflowing in the shared hostel bathroom | Bathroom & Cleaning | CRITICAL | Shared sewage exposure is a significant health and sanitation concern. |
| 18 | The valid visitor pass is not scanning at the entrance | Gate Pass | MEDIUM | A localized access workflow problem requiring staff review. |
| 19 | A chemical spilled in the laboratory and students are nearby | Security | CRITICAL | Chemical exposure near students is an immediate safety concern. |
| 20 | The library door hinge needs oiling | Maintenance | LOW | Low-impact maintenance request with no immediate risk stated. |

To exercise all 20 expected category and priority labels, run:

```powershell
python -m unittest -v
```
