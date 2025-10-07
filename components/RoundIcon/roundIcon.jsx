import React from "react";
import PropTypes from "prop-types";

RoundIcon.propTypes = {
  iconColorClass: PropTypes.string,
  bgColorClass: PropTypes.string,
  className: PropTypes.string,
};
/**
 * RoundIcon component.
 *
 * @param {Object} props - The props for the RoundIcon component.
 * @param {string} [props.iconColorClass="text-purple-600 dark:text-purple-100"] - The class for the icon color.
 * @param {string} [props.bgColorClass="bg-purple-100 dark:bg-purple-600"] - The class for the background color.
 * @param {string} [props.className] - Additional class names for the component.
 * @returns {JSX.Element} The RoundIcon component.
 */
function RoundIcon({
  iconColorClass = "text-purple-600 dark:text-purple-100",
  bgColorClass = "bg-purple-100 dark:bg-purple-600",
  className,
}) {
  // Render the RoundIcon component.
  return (
    <div
      className={`p-3 rounded-full ${className} ${iconColorClass} ${bgColorClass}`}
    ></div>
  );
}

export default RoundIcon;
