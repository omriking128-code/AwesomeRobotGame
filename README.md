# gifted-ai-game-starter

תבנית פתיחה לקורס פיתוח אפליקציות ומשחקים בשיתוף AI לכיתה ח׳ מחוננים.

## Scrap Ring

You start with a pile of parts. The amber Part shop button is on the bench and in the header. Build Rivet by dragging the processor into the chest and dragging a wire from the processor onto each weapon, then mount the wheels, install an OS, and cover the frame. A GPU is optional. Worn parts are repaired for free. A dead part has to be bought again. Selling a part returns 75% of its price.

## איך מתחילים לעבוד

1. פותחים את ה־Codespace של הפרויקט.
2. פותחים Terminal.
3. מריצים:

```bash
npm run dev
```

4. פותחים את תצוגת המשחק דרך Port 5173.

> בפעם הראשונה Codespaces מתקין את החבילות של הפרויקט באופן אוטומטי.

## כלל העבודה המרכזי

לא מבקשים מה־AI לבנות את כל המשחק. עובדים בשינויים קטנים:

**רעיון → תכנון → שינוי קטן → הרצה → בדיקה → Build → Commit → השינוי הבא**

## לפני כל Save Point

ודאו שהמשחק עובד, ואז הריצו:

```bash
npm run build
```

אם ה־build עבר בהצלחה:

```bash
git status
git add .
git commit -m "תיאור קצר של מה ששיניתי"
git push
```

## קבצים חשובים

- `PROJECT.md` — הזיכרון והתכנון של הפרויקט שלכם.
- `AI_GUIDE.md` — כללי העבודה עם Gemini.
- `src/App.tsx` — המסך הראשי שממנו מתחילים.
- `src/styles.css` — העיצוב הראשוני.

## בסוף כל שיעור

1. בודקים שהפרויקט עובד.
2. מריצים `npm run build`.
3. עושים Commit ו־Push.
4. עוצרים את ה־Codespace.
5. מתנתקים מחשבון GitHub במחשב בית הספר.

הפרויקט שלכם חי ב־GitHub — לא במחשב שעליו אתם יושבים.