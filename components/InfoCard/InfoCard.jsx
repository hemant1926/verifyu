import React from "react";
import { Card, CardBody } from "@roketid/windmill-react-ui";
import PropTypes from "prop-types";

InfoCard.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.any.isRequired,
  value: PropTypes.string.isRequired,
};

function InfoCard({ title, value, children }) {
  return (
    <Card>
      <CardBody className="flex items-center">
        {children}
        <div>
          <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
            {value}
          </p>
        </div>
      </CardBody>
    </Card>
  );
}

export default InfoCard;
