import * as url from 'url';
import express from 'express';
import { Low, JSONFile } from 'lowdb';
const app = express();
const port = 3000;
const RESIDENCY_DAYS = 365 * 2;
const CITIZENSHIP_DAYS = 365 * 3;
const FIVE_YEARS = 157784630000;
const ONE_DAY = 86400000;
;
;
const diffToDaysInclusive = (millis) => Math.ceil(millis / ONE_DAY) + 1;
// Configure lowdb to write to JSONFile
const adapter = new JSONFile(url.fileURLToPath(new URL('./days-in-canada.json', import.meta.url)));
const db = new Low(adapter);
const loadEntriesAndExits = async () => {
    await db.read();
    const { residencyDate, entries, exits } = db.data;
    const entryDates = entries.map((date) => new Date(date).getTime());
    const exitDates = exits.map((date) => new Date(date).getTime());
    const parsedResidencyDate = new Date(residencyDate).getTime();
    return { entries: entryDates, exits: exitDates, residencyDate: parsedResidencyDate };
};
const buildResidencyDaysMap = (entries, exits, residencyDate) => entries.reduce((acc, entry, index) => {
    let exit;
    if (exits.length > index) {
        exit = exits[index];
    }
    else if (exits.length === index) {
        exit = Date.now();
    }
    else {
        throw new Error("misformed entry exit pairs");
    }
    if (Date.now() - exit > FIVE_YEARS) {
        return acc;
    }
    if (Date.now() - entry > FIVE_YEARS) {
        entry = Date.now() - FIVE_YEARS;
    }
    if (residencyDate > entry && residencyDate < exit) {
        acc.beforeResidency += diffToDaysInclusive(residencyDate - entry) - 1;
        acc.sinceResidency += diffToDaysInclusive(exit - residencyDate);
        return acc;
    }
    const daysBetween = diffToDaysInclusive(exit - entry);
    if (residencyDate > exit) {
        acc.beforeResidency += daysBetween;
    }
    else {
        acc.sinceResidency += daysBetween;
    }
    return acc;
}, { beforeResidency: 0, sinceResidency: 0 });
const getAccumulatedResidencyDays = async (entries, exits, residencyDate) => {
    return buildResidencyDaysMap(entries, exits, residencyDate).sinceResidency;
};
const getAccumulatedCitizenshipDays = async (entries, exits, residencyDate) => {
    const { beforeResidency, sinceResidency } = buildResidencyDaysMap(entries, exits, residencyDate);
    return Math.min(beforeResidency / 2, 365) + sinceResidency;
};
app.use(express.json());
app.use(express.static(url.fileURLToPath(new URL('./build', import.meta.url))));
app.get("/", (_, res) => {
    res.sendFile(url.fileURLToPath(new URL('./build/index.html', import.meta.url)));
});
app.post("/entry", async (req, res) => {
    await db.read();
    db.data.entries.push(req.body.date);
    await db.write();
    const { entries, exits, residencyDate } = await loadEntriesAndExits();
    res.send({
        ok: true,
        residencyDate,
        residencyDays: await getAccumulatedResidencyDays(entries, exits, residencyDate),
        citizenshipDays: await getAccumulatedCitizenshipDays(entries, exits, residencyDate),
        neededDaysResidency: RESIDENCY_DAYS,
        neededDaysCitizenship: CITIZENSHIP_DAYS,
        inCanada: entries.pop() - exits.pop() > 0 ? true : false,
    });
});
app.post("/exit", async (req, res) => {
    await db.read();
    db.data.exits.push(req.body.date);
    await db.write();
    const { entries, exits, residencyDate } = await loadEntriesAndExits();
    res.send({
        ok: true,
        residencyDate,
        residencyDays: await getAccumulatedResidencyDays(entries, exits, residencyDate),
        citizenshipDays: await getAccumulatedCitizenshipDays(entries, exits, residencyDate),
        neededDaysResidency: RESIDENCY_DAYS,
        neededDaysCitizenship: CITIZENSHIP_DAYS,
        inCanada: entries.pop() - exits.pop() > 0 ? true : false,
    });
});
app.get("/canadianStatusDays", async (_, res) => {
    const { entries, exits, residencyDate } = await loadEntriesAndExits();
    res.send({
        residencyDate,
        residencyDays: await getAccumulatedResidencyDays(entries, exits, residencyDate),
        citizenshipDays: await getAccumulatedCitizenshipDays(entries, exits, residencyDate),
        neededDaysResidency: RESIDENCY_DAYS,
        neededDaysCitizenship: CITIZENSHIP_DAYS,
        inCanada: entries.pop() - exits.pop() > 0 ? true : false,
    });
});
app.listen(port, () => console.log(`Listening on port ${port} 🎉`));
