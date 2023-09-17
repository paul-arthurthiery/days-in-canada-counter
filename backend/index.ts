import * as url from 'url';
import express from 'express';
import { Low, JSONFile } from 'lowdb';
import { Request } from 'express';
import cors from 'cors';

const app = express()
const port = 3000;

const RESIDENCY_DAYS = 365 * 2;
const CITIZENSHIP_DAYS = 365 * 3;

export interface EntryExitDB { entries: string[], exits: string[], residencyDate: string };
export interface AllResidencyInfo {
	entries: string[]
	exits: string[]
	residencyDate: string
	neededDaysResidency: number
	neededDaysCitizenship: number
}


// Configure lowdb to write to JSONFile
const adapter = new JSONFile<EntryExitDB>(url.fileURLToPath(new URL('../days-in-canada.json', import.meta.url)));
const db = new Low<EntryExitDB>(adapter);

const loadEntriesAndExits = async () => {
	await db.read();
	const { residencyDate, entries, exits } = db.data ?? {};
	return { entries, exits, residencyDate }
}

app.use(express.json())
app.use(cors({ origin: '*' }));
app.use(express.static(url.fileURLToPath(new URL('../build', import.meta.url))))

app.get("/", (_, res) => {
	res.sendFile(url.fileURLToPath(new URL('../build/index.html', import.meta.url)));
});

app.post("/entry", async (req: Request<{}, {}, { date: string }>, res) => {
	await db.read();
	db.data?.entries.push(req.body.date)
	await db.write()
	const { entries, exits, residencyDate } = await loadEntriesAndExits();
	res.send({
		ok: true,
		residencyDate,
		entries,
		exits,
		neededDaysResidency: RESIDENCY_DAYS,
		neededDaysCitizenship: CITIZENSHIP_DAYS,
	} as AllResidencyInfo)
});

app.post("/exit", async (req: Request<{}, {}, { date: string }>, res) => {
	await db.read();
	db.data?.exits.push(req.body.date)
	await db.write()
	const { entries, exits, residencyDate } = await loadEntriesAndExits();
	res.send({
		ok: true,
		residencyDate,
		entries,
		exits,
		neededDaysResidency: RESIDENCY_DAYS,
		neededDaysCitizenship: CITIZENSHIP_DAYS,
	} as AllResidencyInfo)
});

app.get("/canadianStatusInfo", async (_, res) => {
	const { entries, exits, residencyDate } = await loadEntriesAndExits();
	res.send({
		residencyDate,
		entries,
		exits,
		neededDaysResidency: RESIDENCY_DAYS,
		neededDaysCitizenship: CITIZENSHIP_DAYS,
	} as AllResidencyInfo)
});

app.listen(port, () => console.log(`Listening on port ${port} 🎉`));