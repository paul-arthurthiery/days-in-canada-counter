import { useState, useEffect } from 'react';

import { Chart, ArcElement, Tooltip, Legend, LinearScale, PointElement, LineElement, TimeScale } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import dayjs from 'dayjs';
import minMax from 'dayjs/plugin/minMax';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import 'chartjs-adapter-date-fns';

import { AllResidencyInfo as AllResidencyInfoStrings } from '../../backend/index';

import CitizenshipGraph from '../citizenshipGraph/CitizenshipGraph';
import { AllResidencyInfo, DaysInCanadaRecord, GraphData } from '../types';
import {
  getAccumulatedCitizenshipDays,
  getAccumulatedResidencyDays,
  getDaysInCanada,
  getIsInCanada,
} from '../utils/entryExitUtils';
import {
  getAllEntriesAndExits,
  getCitizenshipDaysPercentOverTime,
  getResidencyDaysPercentOverTime,
} from '../utils/graphUtils';
import ProgressSection from '../progressSection/ProgressSection';
import { DATE_FORMAT } from '../utils/constants';

Chart.register(ArcElement, Tooltip, Legend, TimeScale, LinearScale, PointElement, LineElement, ChartDataLabels);
dayjs.extend(minMax);
dayjs.extend(utc);
dayjs.extend(timezone);

const Dashboard = () => {
  const [allResidencyInfo, setAllResidencyInfo] = useState<AllResidencyInfo | null>(null);
  const [daysInCanada, setDaysInCanada] = useState<null | DaysInCanadaRecord>(null);
  const [residencyDays, setResidencyDays] = useState(0);
  const [citizenshipDays, setCitizenshipDays] = useState(0);
  const [isInCanada, setInCanada] = useState<boolean>(false);
  const [graphInfo, setGraphInfo] = useState({} as GraphData);
  const updateAllResidencyInfo = ({
    entries,
    exits,
    residencyDate,
    neededDaysResidency,
    neededDaysCitizenship,
  }: AllResidencyInfoStrings) =>
    setAllResidencyInfo({
      entries: entries.map((entry) => dayjs(entry).tz('America/Toronto')),
      exits: exits.map((exit) => dayjs.tz(exit).tz('America/Toronto')),
      residencyDate: dayjs(residencyDate),
      neededDaysResidency,
      neededDaysCitizenship,
    });
  useEffect(() => {
    fetch(`${process.env.NODE_ENV === 'development' && 'http://localhost:3000'}/canadianStatusInfo`)
      .then((response) => response.json())
      .then((allResidencyInfoStrings: AllResidencyInfoStrings) => updateAllResidencyInfo(allResidencyInfoStrings));
  }, []);
  useEffect(() => {
    if (allResidencyInfo === null) return;
    setDaysInCanada(getDaysInCanada(allResidencyInfo));
  }, [allResidencyInfo]);
  useEffect(() => {
    if (daysInCanada === null) return;
    setInCanada(getIsInCanada(daysInCanada)); // TODO: how to calculate this ?
    setResidencyDays(Math.floor(getAccumulatedResidencyDays(daysInCanada)));
    setCitizenshipDays(Math.floor(getAccumulatedCitizenshipDays(daysInCanada)));
  }, [daysInCanada]);
  useEffect(() => {
    if (allResidencyInfo === null || daysInCanada === null) return;
    setGraphInfo({
      allEntriesAndExits: getAllEntriesAndExits(daysInCanada),
      citizenshipDaysPercentOverTime: getCitizenshipDaysPercentOverTime(
        allResidencyInfo.neededDaysCitizenship,
        daysInCanada,
      ),
      residencyDaysPercentOverTime: getResidencyDaysPercentOverTime(allResidencyInfo.neededDaysResidency, daysInCanada),
    });
  }, [allResidencyInfo, daysInCanada]);
  // const leaveCanada = () => updateEntryExit(false);
  // const enterCanada = () => updateEntryExit(true);
  // const updateEntryExit = (entry: boolean) => {
  //  fetch(entry ? "/entry": "/exit", {
  //    method: 'POST',
  //      headers: {
  //        'Content-Type': 'application/json',
  //      },
  //      body: JSON.stringify({ date: new Date().toISOString().substring(0, 10) })
  //    })
  //    .then((response) => response.json())
  //     .then((allResidencyInfo: AllResidencyInfo & {ok: boolean}) =>
  //        allResidencyInfo.ok ? updateAllResidencyInfo(allResidencyInfo) : setInCanada(!entry))
  //    .catch(() => setInCanada(!entry))
  // };
  return (
    <div>
      {(!daysInCanada || !allResidencyInfo) && <p>Loading...</p>}
      {!!daysInCanada && !!allResidencyInfo && (
        <>
          <h1>Immigration Status Day Counter</h1>
          <ProgressSection
            residencyDays={residencyDays}
            citizenshipDays={citizenshipDays}
            neededDaysCitizenship={allResidencyInfo.neededDaysCitizenship}
            neededDaysResidency={allResidencyInfo.neededDaysResidency}
            residencyDate={allResidencyInfo.residencyDate}
          />
          <p>Soonest date to become citizen: {daysInCanada.soonestTimestampCitizen().format(DATE_FORMAT)}</p>
          <p>
            <span>
              Currently
              {!isInCanada && 'not'} in Canada
              {isInCanada ? '🇨🇦' : '🌴'}
            </span>
            {/* {inCanada
              ? <Button variant="danger" onClick={leaveCanada}>I've left Canada</Button>
              : <Button variant="primary" onClick={enterCanada}>I've returned to Canada</Button>
            } */}
          </p>
          {!!graphInfo.allEntriesAndExits?.length && (
            <CitizenshipGraph graphData={graphInfo} dateFormat={DATE_FORMAT} />
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
