import { gql } from "@apollo/client";

export const GET_EVENTS = gql`
  query Events($filter: EventsFilterInput!) {
    events(filter: $filter) {
      id
      seriesId
      title
      description
      startAt
      endAt
      allDay
      repeat
      type
      scope
      reminderAt
      createdById
    }
  }
`;

export const CREATE_EVENT = gql`
  mutation CreateEvent($input: CreateEventInput!) {
    createEvent(input: $input) {
      id
      title
      description
      startAt
      endAt
      allDay
      repeat
      type
      scope
      reminderAt
      createdById
    }
  }
`;

export const UPDATE_EVENT = gql`
  mutation UpdateEvent($id: ID!, $input: UpdateEventInput!) {
    updateEvent(id: $id, input: $input) {
      id
      title
      description
      startAt
      endAt
      allDay
      repeat
      type
      scope
      reminderAt
      createdById
    }
  }
`;

export const DELETE_EVENT = gql`
  mutation DeleteEvent($input: DeleteEventInput!) {
    deleteEvent(input: $input) {
      id
    }
  }
`;

export const CHANGE_EVENT_SCOPE = gql`
  mutation ChangeEventScope($id: ID!, $scope: EventScope!) {
    changeEventScope(id: $id, scope: $scope) {
      id
      scope
      userId
      coupleId
    }
  }
`;
