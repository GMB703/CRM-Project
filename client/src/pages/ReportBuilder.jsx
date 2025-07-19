import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const ReportBuilder = () => {
  const [availableFields, setAvailableFields] = useState([
    { id: 'firstName', name: 'First Name' },
    { id: 'lastName', name: 'Last Name' },
    { id: 'email', name: 'Email' },
    { id: 'phone', name: 'Phone' },
    { id: 'status', name: 'Status' },
  ]);
  const [selectedFields, setSelectedFields] = useState([]);

  const onDragEnd = (result) => {
    const { source, destination } = result;

    if (!destination) {
      return;
    }

    if (source.droppableId === destination.droppableId) {
      // Reorder fields
      const items = Array.from(
        source.droppableId === 'available' ? availableFields : selectedFields,
      );
      const [reorderedItem] = items.splice(source.index, 1);
      items.splice(destination.index, 0, reorderedItem);

      if (source.droppableId === 'available') {
        setAvailableFields(items);
      } else {
        setSelectedFields(items);
      }
    } else {
      // Move field between lists
      const sourceItems = Array.from(
        source.droppableId === 'available' ? availableFields : selectedFields,
      );
      const destItems = Array.from(
        destination.droppableId === 'available' ? availableFields : selectedFields,
      );
      const [movedItem] = sourceItems.splice(source.index, 1);
      destItems.splice(destination.index, 0, movedItem);

      if (source.droppableId === 'available') {
        setAvailableFields(sourceItems);
        setSelectedFields(destItems);
      } else {
        setSelectedFields(sourceItems);
        setAvailableFields(destItems);
      }
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Custom Report Builder</h1>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex space-x-6">
          <Droppable droppableId="available">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="w-1/2 p-4 border rounded"
              >
                <h2 className="text-lg font-semibold mb-4">Available Fields</h2>
                {availableFields.map((field, index) => (
                  <Draggable key={field.id} draggableId={field.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="p-2 mb-2 bg-gray-100 rounded"
                      >
                        {field.name}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
          <Droppable droppableId="selected">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="w-1/2 p-4 border rounded"
              >
                <h2 className="text-lg font-semibold mb-4">Selected Fields</h2>
                {selectedFields.map((field, index) => (
                  <Draggable key={field.id} draggableId={field.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="p-2 mb-2 bg-gray-100 rounded"
                      >
                        {field.name}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      </DragDropContext>
    </div>
  );
};

export default ReportBuilder; 