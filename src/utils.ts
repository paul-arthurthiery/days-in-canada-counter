import dayjs, { Dayjs } from "dayjs";
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'

dayjs.extend(isSameOrBefore)

export interface DaysInCanadaRecord {
    beforeResidency: number[];
    afterResidency: number[];
    future: number[];
    soonestTimestampCitizen: Dayjs;
}

export const getDaysInCanada = (initialEntries: Dayjs[], initialExits: Dayjs[], residencyDate: Dayjs, neededDaysCitizenship: number): DaysInCanadaRecord => {
    const isLastDayAnEntry = initialEntries.at(-1)?.isAfter(initialExits.at(-1));
    const entriesAllTimes = initialEntries.concat([residencyDate]).sort((a, b) => a.isBefore(b) ? -1 : 1);
    const exitsAllTime = initialExits.concat([residencyDate]).sort((a, b) => a.isBefore(b) ? -1 : 1);
    const earliestDateCitizenshipDays = residencyDate.subtract(5, 'year')
    const [entries, exits] = entriesAllTimes.reduce((acc, entry, index) => {
        const exit = exitsAllTime[index]
        if (!exit) {
            acc[0].push(entry);
            return acc;
        }
        if (exit.isBefore(earliestDateCitizenshipDays)) {
            return acc
        }
        if (entry.isBefore(earliestDateCitizenshipDays)) {
            acc[0].push(earliestDateCitizenshipDays);
            acc[1].push(exit);
            return acc;
        }
        acc[0].push(entry);
        acc[1].push(exit);
        return acc;
    }, [[], []] as [Dayjs[], Dayjs[]])
    const daysInCanada = entries.reduce((acc, entry, index) => {
        const exit = exits[index];
        if (!exit) {
            return acc;
        }
        if (exit.isSameOrBefore(residencyDate)) {
            acc.beforeResidency.push(exit.diff(entry, 'd') + 1);
        } else if (exit.isSameOrBefore(dayjs())) {
            acc.afterResidency.push(exit.diff(entry, 'd') + 1);
        } else {
            acc.future.push(exit.diff(entry, 'd') + 1)
        }
        return acc;
    }, { beforeResidency: [], afterResidency: [], future: [], soonestTimestampCitizen: residencyDate.add(5, 'y') } as DaysInCanadaRecord);
    if (isLastDayAnEntry) {
        const missingDays = neededDaysCitizenship - getAccumulatedCitizenshipDays(daysInCanada) - getFutureCitizenshipDays(daysInCanada)
        daysInCanada.future.push(missingDays);
        daysInCanada.soonestTimestampCitizen = dayjs(entries.at(-1)).add(missingDays, 'd');
    }
    return daysInCanada;
}

export const getAccumulatedResidencyDays = ({ afterResidency }: DaysInCanadaRecord) => afterResidency?.reduce((acc, curr) => acc += curr, 0);

export const getAccumulatedCitizenshipDays = ({ beforeResidency, afterResidency }: DaysInCanadaRecord) => {
    return Math.min(beforeResidency?.reduce((acc, curr) => acc += curr, 0) / 2, 365) + afterResidency?.reduce((acc, curr) => acc += curr, 0);
}

export const getFutureCitizenshipDays = ({ future }: DaysInCanadaRecord) => {
    return future.reduce((acc, curr) => acc += curr, 0);
}