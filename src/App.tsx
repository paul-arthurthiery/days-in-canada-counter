import React, { useState, useEffect } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import minMax from 'dayjs/plugin/minMax';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { ProgressBar } from 'react-bootstrap';
import { Chart, ArcElement, Tooltip, Legend, LinearScale, PointElement, LineElement, TimeScale } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { Line } from "react-chartjs-2";
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { DaysInCanadaRecord, getAccumulatedCitizenshipDays, getAccumulatedResidencyDays, getDaysInCanada } from './utils';
import { AllResidencyInfo } from '../backend/index';

import './styles.scss';

Chart.register(ArcElement, Tooltip, Legend, TimeScale, LinearScale, PointElement, LineElement, ChartDataLabels);
dayjs.extend(minMax)
dayjs.extend(utc)
dayjs.extend(timezone)

const DATE_FORMAT = 'YYYY-MM-DD';

const App = () => {
  const [entries, setEntries] = useState([] as Dayjs[]);
  const [exits, setExits] = useState([] as Dayjs[]);
  const [daysInCanada, setDaysInCanada] = useState({ beforeResidency: [], afterResidency: [], future: [], soonestTimestampCitizen: dayjs() } as DaysInCanadaRecord);
  const [residencyDate, setResidencyDate] = useState(dayjs());
  const [residencyDays, setResidencyDays] = useState(0);
  const [citizenshipDays, setCitizenshipDays] = useState(0);
  const [neededDaysResidency, setNeededDaysResidency] = useState(0);
  const [neededDaysCitizenship, setNeededDaysCitizenship] = useState(0);
  const [isInCanada, setInCanada] = useState<null | boolean>(null);
  const updateAllResidencyInfo = ({ entries, exits, residencyDate, neededDaysResidency, neededDaysCitizenship }: AllResidencyInfo) => {
    setEntries(entries.map(entry => dayjs(entry).tz("America/Toronto")));
    setExits(exits.map(exit => dayjs.tz(exit).tz("America/Toronto")));
    setResidencyDate(dayjs(residencyDate));
    setNeededDaysResidency(neededDaysResidency);
    setNeededDaysCitizenship(neededDaysCitizenship);
  }
  useEffect(() => {
    fetch("http://localhost:3000/canadianStatusInfo")
      .then((response) => response.json())
      .then((allResidencyInfo: AllResidencyInfo) => updateAllResidencyInfo(allResidencyInfo))
  }, []);
  useEffect(() => {
    setDaysInCanada(getDaysInCanada(entries, exits, residencyDate, neededDaysCitizenship))
    setInCanada(entries.findLast((date) => date.isBefore(dayjs()))?.isAfter(exits.findLast((date) => date.isBefore(dayjs()))) ?? null); //TODO: how to calculate this ?
  }, [entries, exits, residencyDate])
  useEffect(() => {
    setResidencyDays(Math.floor(getAccumulatedResidencyDays(daysInCanada)))
    setCitizenshipDays(Math.floor(getAccumulatedCitizenshipDays(daysInCanada)));
  }, [daysInCanada])
  // const leaveCanada = () => updateEntryExit(false);
  // const enterCanada = () => updateEntryExit(true);
  // const updateEntryExit = (entry: boolean) => {
  // 	fetch(entry ? "/entry": "/exit", {
  // 		method: 'POST',
  // 		headers: {
  // 			'Content-Type': 'application/json',
  // 		},
  // 		body: JSON.stringify({ date: new Date().toISOString().substring(0, 10) })
  // 	})
  // 		.then((response) => response.json())
  // 		.then((allResidencyInfo: AllResidencyInfo & {ok: boolean}) => allResidencyInfo.ok ? updateAllResidencyInfo(allResidencyInfo) : setInCanada(!entry))
  // 		.catch(() => setInCanada(!entry))
  // };
  const residencyDaysOverTime = new Array(daysInCanada.beforeResidency?.length).fill(0).concat([...daysInCanada.afterResidency, ...daysInCanada.future])?.reduce((acc, value) => {
    const previousValue = acc.at(-1) ?? 0
    acc.push(previousValue);
    acc.push(previousValue + value)
    return acc;
  }, [] as number[]).map((days: number) => Math.min(100, (days / neededDaysResidency) * 100));
  const citizenshipDaysOverTimeBeforeResidency = daysInCanada.beforeResidency?.reduce((acc, days) => {
    const previousValue = acc.at(-1) ?? 0
    acc.push(previousValue);
    if (previousValue + days / 2 > 365) {
      acc.push(365);
      return acc;
    }
    acc.push(previousValue + days / 2);
    return acc;
  }, [] as number[]);
  const citizenshipDaysOverTimeAfterResidency = daysInCanada.afterResidency?.reduce((acc, value) => {
    const previousValue = acc.at(-1) ?? citizenshipDaysOverTimeBeforeResidency.at(-1) ?? 0;
    acc.push(previousValue);
    acc.push(previousValue + value)
    return acc
  }, [] as number[]);
  const citizenshipDaysOverTimeFuture = daysInCanada.future?.reduce((acc, value) => {
    const previousValue = acc.at(-1) ?? citizenshipDaysOverTimeAfterResidency.at(-1) ?? 0;
    acc.push(previousValue);
    acc.push(previousValue + value)
    return acc
  }, [] as number[]);
  const citizenshipDaysOverTime = [...citizenshipDaysOverTimeBeforeResidency, ...citizenshipDaysOverTimeAfterResidency, ...citizenshipDaysOverTimeFuture].map((days) => Math.min(100, (days / neededDaysCitizenship) * 100));
  const allEntriesExits = [...entries, ...exits, daysInCanada.soonestTimestampCitizen, residencyDate, residencyDate].sort((a, b) => a.isBefore(b) ? -1 : 1).map((date) => date.format(DATE_FORMAT));
  return (
    <div className="App">
      <h1>Immigration Status Day Counter</h1>
      {!!residencyDate && <span>Became a resident on {dayjs(residencyDate).format(DATE_FORMAT)}</span>}
      <p>Residency renewal Progress: {residencyDays} days</p>
      <ProgressBar animated now={(residencyDays / neededDaysResidency) * 100} label={`${Math.floor((residencyDays / neededDaysResidency) * 100)}%`} />
      <p>Citizenship Progress: {citizenshipDays} days</p>
      <ProgressBar animated now={(citizenshipDays / neededDaysCitizenship) * 100} label={`${Math.floor((citizenshipDays / neededDaysCitizenship) * 100)}%`} />
      {!!residencyDate && <p>Soonest date to become citizen: {daysInCanada.soonestTimestampCitizen.format(DATE_FORMAT)} </p>}
      <p>
        <span>Currently {!isInCanada && "not"} in Canada {isInCanada ? "🇨🇦" : "🌴"}</span>
        {/* {inCanada
					? <Button variant="danger" onClick={leaveCanada}>I've left Canada</Button>
					: <Button variant="primary" onClick={enterCanada}>I've returned to Canada</Button>
				} */}
      </p>
      <Line
        data={{
          labels: allEntriesExits,
          datasets: [
            {
              label: 'Citizenship days',
              data: citizenshipDaysOverTime,
              pointStyle: false,
              borderColor: '#FF6384',
              backgroundColor: '#FFB1C1',
            },
            {
              label: 'Residency renewal days',
              data: residencyDaysOverTime,
              pointStyle: false,
              borderColor: '#36A2EB',
              backgroundColor: '#9BD0F5',
            },
          ]
        }}
        options={{
          plugins: {
            datalabels: {
              formatter: (value, { dataIndex, dataset }) => {
                if (dataIndex === dataset.data.length - 1) return allEntriesExits.at(-1);
                return ''
              },
              align: 'left',
              backgroundColor: ({ dataIndex, dataset }) => dataIndex === dataset.data.length - 1 ? '#FFF' : '',
              borderColor: ({ dataIndex, dataset }) => dataIndex === dataset.data.length - 1 ? '#FF6384' : '',
              borderWidth: 1,
            }
          },
          responsive: true,
          scales: {
            x: {
              type: 'time',
              time: {
                unit: 'month'
              },
              ticks: {
                maxTicksLimit: 20
              }
            },
            y: {
              beginAtZero: true,
              ticks: {
                callback: function (value) {
                  return value + '%';
                }
              }
            }
          },
          animations: {
            radius: {
              duration: 400,
              easing: 'linear',
              loop: (context) => context.active
            }
          },
        }}
      />
    </div>
  );
}

export default App;
