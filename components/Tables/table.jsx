'use client'
import React, { useState, useEffect } from "react";

import {
  Table,
  TableHeader,
  TableCell,
  TableBody,
  TableRow,
  TableFooter,
  TableContainer,
  Button,
  Pagination,
} from "@roketid/windmill-react-ui";
import PropTypes from "prop-types";
// make a copy of the data, for the second table

Tables.propTypes = {
  headers: PropTypes.array.isRequired,
  response: PropTypes.array.isRequired,
  showActionBtn: PropTypes.bool.isRequired,
  Actions: PropTypes.array,
};

function Tables({ headers, response, showActionBtn, Actions }) {
  /**
   * DISCLAIMER: This code could be badly improved, but for the sake of the example
   * and readability, all the logic for both table are here.
   * You would be better served by dividing each table in its own
   * component, like Table(?) and TableWithActions(?) hiding the
   * presentation details away from the page view.
   */

  // setup pages control for every table
  const [pageTable, setPageTable] = useState(1);

  // setup data for every table
  const [dataTable, setDataTable] = useState([]);

  // pagination setup
  const resultsPerPage = 10;
  const totalResults = response.length;

  // pagination change control
  function onPageChangeTable2(p) {
    setPageTable(p);
  }

  // on page change, load new sliced data
  // here you would make another server request for new data

  // on page change, load new sliced data
  // here you would make another server request for new data
  useEffect(() => {
    setDataTable(
      response.slice(
        (pageTable - 1) * resultsPerPage,
        pageTable * resultsPerPage
      )
    );
  }, [pageTable  , response]);

  return (
    <>
      {/* <SectionTitle>Table with actions</SectionTitle> */}
      <TableContainer className="mb-8">
        <Table>
          <TableHeader>
            <tr>
              {headers.map((header, i) => (
                <TableCell key={i}>{header.label}</TableCell>
              ))}
              {showActionBtn && <TableCell>Actions</TableCell>}
            </tr>
          </TableHeader>
          <TableBody>
            {dataTable.map((data, indexOFData) => (
              <TableRow key={indexOFData}>
                {headers.map((header, index) => (
                  <TableCell key={index}>
                    <span className="text-sm">{data[header.key]}</span>
                  </TableCell>
                ))}

                {showActionBtn && (
                  <TableCell>
                    <div className="flex items-center space-x-4">
                      {Actions.map((action, i) => (
                        <Button
                          layout="link"
                          size="small"
                          aria-label={action.label}
                          key={i}
                          onClick={() => action.onClick(indexOFData)}
                        >
                          {action.child}
                        </Button>
                      ))}
                      {/* <Button layout="link" size="small" aria-label="Edit">
                        <EditIcon className="w-5 h-5" aria-hidden="true" />
                      </Button>
                      <Button layout="link" size="small" aria-label="Delete">
                        <TrashIcon className="w-5 h-5" aria-hidden="true" />
                      </Button> */}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TableFooter>
          <Pagination
            totalResults={totalResults}
            resultsPerPage={resultsPerPage}
            onChange={onPageChangeTable2}
            label="Table navigation"
          />
        </TableFooter>
      </TableContainer>
    </>
  );
}

export default Tables;
