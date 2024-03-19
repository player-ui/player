import React from 'react';
import { Table, HeadCell, Cell, Body, Row } from '@devtools-ds/table';
import { useSelector } from 'react-redux';
import { Placeholder } from '@storybook/components';
import type { EventType } from '../../state';
import type { StateType } from '../../redux';
import { useContentKind } from '../../redux';

import styles from './events.css';

interface EventsPanelProps {
  /** if the panel is shown */
  active: boolean;
}

/** Pad the cells to give room */
const ExtraCells = (event: EventType) => {
  if (event.type === 'log') {
    return (
      <>
        <td>{event.severity}</td>
        <td>{event.message.map((a) => JSON.stringify(a)).join(' ')}</td>
      </>
    );
  }

  if (event.type === 'dataChange') {
    return (
      <>
        <td>{event.binding}</td>
        <td>{`${JSON.stringify(event.from)} ➜ ${JSON.stringify(event.to)}`}</td>
      </>
    );
  }

  if (event.type === 'stateChange') {
    let name: string = event.state;

    if (event.state === 'completed') {
      name = `${name} (${event.error ? 'error' : 'success'})`;
    }

    return (
      <>
        <td>{name}</td>
        <td>{event.outcome ?? event.error ?? ''}</td>
      </>
    );
  }

  if (event.type === 'metric') {
    return (
      <>
        <td>{event.metricType}</td>
        <td>{event.message}</td>
      </>
    );
  }

  return null;
};

/** The panel to show events */
export const EventsPanel = (props: EventsPanelProps) => {
  const events = useSelector<StateType, EventType[]>((state) => state.events);
  const contentType = useContentKind();

  if (!props.active) {
    return null;
  }

  if (contentType === undefined) {
    return (
      <Placeholder>
        This story is not configured to receive Player events.
      </Placeholder>
    );
  }

  return (
    <Table>
      <Table.HeadCell className={styles.header}>
        <Table.Row>
          <Table.Cell>Time</Table.Cell>
          <Table.Cell>Type</Table.Cell>
        </Table.Row>
      </Table.HeadCell>
      <Table.Body>
        {events.map((evt) => (
          <Table.Row key={evt.id}>
            <Table.Cell>{evt.time}</Table.Cell>
            <Table.Cell>{evt.type}</Table.Cell>
            <ExtraCells {...evt} />
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
};
