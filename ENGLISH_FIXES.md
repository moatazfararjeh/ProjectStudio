# English Language Issues & Fixes (80% Working)

## Current Status
✅ **Working (80%):**
- Basic navigation and menus
- User authentication
- Dashboard and project views
- Most form labels and buttons

⚠️ **Potential Issues (20%):**
1. Date formats might be showing Arabic numerals
2. Some dynamic content might not have translations
3. Error messages might be in Arabic
4. Some table columns might need translation keys

## Quick Fixes Applied

### 1. ConfigProvider Theme
Updated `main.tsx` with proper locale handling:
```typescript
locale={language === 'ar' ? arEG : enUS}
```

### 2. Date Picker Locale
Ensure all DatePickers use the correct locale:
```typescript
<DatePicker locale={language === 'ar' ? arLocale : enLocale} />
```

### 3. Number Formatting
For proper number display:
```typescript
{number.toLocaleString(language === 'en' ? 'en-US' : 'ar-SA')}
```

## Missing Translation Keys Check

Run this in browser console to find missing keys:
```javascript
// Check for untranslated content
const elements = document.querySelectorAll('*');
const arabicRegex = /[\u0600-\u06FF]/;
elements.forEach(el => {
  if (arabicRegex.test(el.textContent) && el.children.length === 0) {
    console.log('Arabic text found:', el.textContent, el);
  }
});
```

## Common Issues

### Issue 1: Status/Priority Values
**Problem:** Hardcoded status values showing as keys
**Solution:** Use translation mapping:
```typescript
const statusMap = {
  PLANNING: t('status.planning'),
  IN_PROGRESS: t('status.inProgress'),
  // etc...
};
```

### Issue 2: Table Columns
**Problem:** Column titles not translated
**Solution:** Ensure all columns use t():
```typescript
{
  title: t('projects.name'),
  dataIndex: 'name'
}
```

### Issue 3: Toast Messages
**Problem:** Success/Error messages in Arabic
**Solution:** Already using t() in most places, verify:
```typescript
message.success(t('projects.createSuccess'));
```

## Verification Checklist

- [ ] All menu items translated
- [ ] All form labels translated
- [ ] All button texts translated
- [ ] All table headers translated
- [ ] All status/priority values translated
- [ ] All error messages translated
- [ ] All success messages translated
- [ ] Date formats correct
- [ ] Number formats correct
- [ ] Currency formats correct (if applicable)

## Testing Commands

1. Switch to English:
   - Click "عربي" button in header
   - Verify all text changes to English

2. Test specific areas:
   - Dashboard cards
   - Project list and details
   - Team members
   - Tasks
   - RAID log
   - Reports
   - Settings

## Known Working Areas (80%)
✅ Navigation menu
✅ User dropdown
✅ Login/Register forms
✅ Dashboard statistics
✅ Project list
✅ Team view
✅ Basic CRUD operations
✅ Form validations
✅ Success notifications

## Areas to Verify (20%)
⚠️ Date displays in tables
⚠️ Status badge translations
⚠️ Priority badge translations
⚠️ Dynamic error messages
⚠️ File export messages
⚠️ Chart labels (if any)
⚠️ Tooltip texts
⚠️ Placeholder texts in inputs
