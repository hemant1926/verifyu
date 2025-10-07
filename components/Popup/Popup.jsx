
import React from "react";

import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@roketid/windmill-react-ui";
import PropTypes from "prop-types";

PopUp.propTypes = {
  popUpHeader: PropTypes.string.isRequired,
  popUpBody: PropTypes.any.isRequired,
  popBtn: PropTypes.array.isRequired,
  isModalOpen: PropTypes.bool.isRequired,
  closeModal: PropTypes.func.isRequired,
};
/**
 * @function PopUp
 * @description A reusable modal component for dialogs.
 * @param {string} popUpHeader - The header text of the modal.
 * @param {any} popUpBody - The body content of the modal.
 * @param {array} popBtn - An array of buttons for the modal footer.
 * @param {boolean} isModalOpen - A boolean indicating if the modal is open or not.
 * @param {function} closeModal - A function to close the modal.
 * @returns {JSX.Element} A modal dialog component.
 */
export default function PopUp({
  popUpHeader,
  popUpBody,
  popBtn,
  isModalOpen,
  closeModal,
}) {
  return (
    <Modal isOpen={isModalOpen} onClose={closeModal}>
      {/* Modal Header */}
      <ModalHeader> {popUpHeader}</ModalHeader>
      {/* Modal Body */}
      <ModalBody>{popUpBody}</ModalBody>
      {/* Modal Footer */}
      <ModalFooter>
        {/* Buttons for larger screens */}
        {popBtn.map((btn, i) => (
          <div className="hidden sm:block" key={i}>
            {btn}
          </div>
        ))}
        {/* Buttons for smaller screens */}
        {popBtn.map((btn, i) => (
          <div className="block my-4 w-full sm:hidden" key={i}>
            {btn}
          </div>
        ))}
      </ModalFooter>
    </Modal>
  );
}
