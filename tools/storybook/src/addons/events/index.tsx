import React from "react";
import { Table, Head, HeadCell, Cell, Body, Row } from "@devtools-ds/table";
import { useSelector } from "react-redux";
import { Placeholder } from "storybook/internal/components";
import type { EventType } from "../../state";
import type { StateType } from "../../redux";
import { useContentKind } from "../../redux";

import { API } from "storybook/internal/manager-api";

interface EventsPanelProps {
  /** if the panel is shown */
  active: boolean;

  /** Storybook manager API */
  api: API;
}

/** Pad the cells to give room */
const ExtraCells = (event: EventType) => {
  if (event.type === "log") {
    return (
      <>
        <td>{event.severity}</td>
        <td>{event.message.map((a) => JSON.stringify(a)).join(" ")}</td>
      </>
    );
  }

  if (event.type === "dataChange") {
    return (
      <>
        <td>{event.binding}</td>
        <td>{`${JSON.stringify(event.from)} ➜ ${JSON.stringify(event.to)}`}</td>
      </>
    );
  }

  if (event.type === "stateChange") {
    let name: string = event.state;

    if (event.state === "completed") {
      name = `${name} (${event.error ? "error" : "success"})`;
    }

    return (
      <>
        <td>{name}</td>
        <td>{event.outcome ?? event.error ?? ""}</td>
      </>
    );
  }

  if (event.type === "metric") {
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
    <div>
      <Table>
        <Head>
          <Row>
            <HeadCell>Time</HeadCell>
            <HeadCell>Type</HeadCell>
            <HeadCell />
            <HeadCell />
          </Row>
        </Head>
        <Body>
          {events.map((evt) => (
            <Row key={evt.id}>
              <Cell>{evt.time}</Cell>
              <Cell>{evt.type}</Cell>
              <ExtraCells {...evt} />
            </Row>
          ))}
        </Body>
      </Table>
    </div>
  );
};
