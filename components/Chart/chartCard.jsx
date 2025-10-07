import React from "react";
import PropTypes from "prop-types";


export default function Chart({ children, title }) {
    return (
        <div className="min-w-0  p-4 bg-white rounded-lg shadow-xs dark:bg-gray-800">
            <p className="mb-4 font-semibold text-gray-800 dark:text-gray-300">
                {title}
            </p>
            {children}
        </div>
    );
}

Chart.propTypes = {
    children: PropTypes.any.isRequired,
    title: PropTypes.any.isRequired,
};