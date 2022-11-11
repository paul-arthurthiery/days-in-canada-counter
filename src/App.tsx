import * as React from 'react';
import { useState, useEffect } from "react";
import { Button, ProgressBar } from 'react-bootstrap';

const ONE_DAY = 86400000;

interface AllResidencyInfo {
  residencyDays: number
  citizenshipDays: number
  residencyDate: string
  neededDaysResidency: number
  neededDaysCitizenship: number
  inCanada: boolean
}

const App = () => {
  const [residencyDays, setResidencyDays] = useState(0);
  const [citizenshipDays, setCitizenshipDays] = useState(0);
  const [residencyDate, setResidencyDate] = useState('');
  const [neededDaysResidency, setNeededDaysResidency] = useState(0);
  const [neededDaysCitizenship, setNeededDaysCitizenship] = useState(0);
  const [inCanada, setInCanada] = useState<null|boolean>(null);
  const updateAllResidencyInfo = ({ residencyDays, citizenshipDays, residencyDate, neededDaysResidency, neededDaysCitizenship, inCanada }: AllResidencyInfo) => {
    setResidencyDays(Math.floor(residencyDays));
    setCitizenshipDays(Math.floor(citizenshipDays));
    setResidencyDate(residencyDate);
    setNeededDaysResidency(neededDaysResidency);
    setNeededDaysCitizenship(neededDaysCitizenship);
    setInCanada(inCanada)
  }
  useEffect(() => {
    fetch("/canadianStatusDays")
      .then((response) => response.json())
      .then((allResidencyInfo: AllResidencyInfo) => updateAllResidencyInfo(allResidencyInfo))
  }, []);
	const leaveCanada = () => updateEntryExit(false);
	const enterCanada = () => updateEntryExit(true);
	const updateEntryExit = (entry: boolean) => {
		setInCanada(entry);
		fetch(entry ? "/entry": "/exit", {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ date: new Date().toISOString().substring(0, 10) })
		})
			.then((response) => response.json())
			.then((allResidencyInfo: AllResidencyInfo & {ok: boolean}) => allResidencyInfo.ok ? updateAllResidencyInfo(allResidencyInfo) : setInCanada(!entry))
			.catch(() => setInCanada(!entry))
	};
  return (
    <div className="App">
    	<h1>Immigration Status Day Counter</h1>
    	{!!residencyDate && <span>Became a resident on {new Date(residencyDate).toISOString().substring(0, 10)}</span>}
    	<p>Residency Progress: {residencyDays} days</p>
    	<ProgressBar animated now={(residencyDays/neededDaysResidency)*100} label={`${Math.floor((residencyDays/neededDaysResidency)*100)}%`} />
    	<p>Citizenship Progress: {citizenshipDays} days</p>
    	<ProgressBar animated now={(citizenshipDays/neededDaysCitizenship)*100} label={`${Math.floor((citizenshipDays/neededDaysCitizenship)*100)}%`} />
    	{!!residencyDate && <p>Soonest date to become citizen: {new Date(residencyDate+Math.max(730, 1095-citizenshipDays)*ONE_DAY).toISOString().substring(0, 10)} </p>}
    	{inCanada !== null && (<p>
      	<span>Currently {!inCanada && "not"} in Canada {inCanada ? "🇨🇦" : "🌴"}</span>
				{inCanada
					? <Button variant="danger" onClick={leaveCanada}>I've left Canada</Button>
					: <Button variant="primary" onClick={enterCanada}>I've returned to Canada</Button>
				}
			</p>)}
    </div>
  );
}

export default App;
