import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const PipelineView = ({ leads, onDragEnd }) => {
  const columns = {
    NEW: {
      name: 'New',
      items: leads.filter((lead) => lead.status === 'NEW'),
    },
    CONTACTED: {
      name: 'Contacted',
      items: leads.filter((lead) => lead.status === 'CONTACTED'),
    },
    QUALIFIED: {
      name: 'Qualified',
      items: leads.filter((lead) => lead.status === 'QUALIFIED'),
    },
    PROPOSAL: {
      name: 'Proposal',
      items: leads.filter((lead) => lead.status === 'PROPOSAL'),
    },
    NEGOTIATION: {
      name: 'Negotiation',
      items: leads.filter((lead) => lead.status === 'NEGOTIATION'),
    },
    WON: {
      name: 'Won',
      items: leads.filter((lead) => lead.status === 'WON'),
    },
    LOST: {
      name: 'Lost',
      items: leads.filter((lead) => lead.status === 'LOST'),
    },
  };

  return (
    <div className="flex">
      <DragDropContext onDragEnd={onDragEnd}>
        {Object.entries(columns).map(([columnId, column]) => (
          <Droppable key={columnId} droppableId={columnId}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="w-1/4 p-4"
              >
                <h2 className="text-lg font-semibold mb-4">{column.name}</h2>
                {column.items.map((item, index) => (
                  <Draggable key={item.id} draggableId={item.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="p-4 mb-4 bg-white rounded-lg shadow"
                      >
                        <h3 className="font-semibold">{item.firstName} {item.lastName}</h3>
                        <p className="text-gray-600">{item.email}</p>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        ))}
      </DragDropContext>
    </div>
  );
};

export default PipelineView;
