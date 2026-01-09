import { BBManager, RecordingStaff, City, BloodDonor, DiseaseFinder, BloodSpecimen, Hospital, HospitalNeed, Recipient } from '../types';

// Mock Data based on the SQL schema

export const managers: BBManager[] = [
  { M_id: 101, mName: 'Vatsalya', m_phNo: 9693959671 },
  { M_id: 102, mName: 'Vicky', m_phNo: 9693959672 },
  { M_id: 103, mName: 'Light', m_phNo: 9693959673 },
  { M_id: 104, mName: 'Eren', m_phNo: 9693959674 },
  { M_id: 105, mName: 'Mikasa', m_phNo: 9693959675 },
];

export const recordingStaff: RecordingStaff[] = [
  { reco_ID: 101012, reco_Name: 'Tanjiro', reco_phNo: 4044846553 },
  { reco_ID: 101112, reco_Name: 'Zenitsu', reco_phNo: 4045856553 },
  { reco_ID: 101212, reco_Name: 'Inosuke', reco_phNo: 4045806553 },
  { reco_ID: 101312, reco_Name: 'Mitsuri', reco_phNo: 4045806553 },
  { reco_ID: 101412, reco_Name: 'Nezuko', reco_phNo: 4045806553 },
];

export const cities: City[] = [
  { City_ID: 1100, City_name: 'Asgard' },
  { City_ID: 1200, City_name: 'Paradis' },
  { City_ID: 1300, City_name: 'Marley' },
  { City_ID: 1400, City_name: 'Wakanda' },
  { City_ID: 1500, City_name: 'Valhalla' },
];

export const bloodDonors: BloodDonor[] = [
  { bd_ID: 150011, bd_name: 'Steven', bd_age: 25, bd_sex: 'M', bd_Bgroup: 'O+', bd_reg_date: '2015-07-19', reco_ID: 101412, City_ID: 1100 },
  { bd_ID: 150012, bd_name: 'Tony', bd_age: 35, bd_sex: 'M', bd_Bgroup: 'A-', bd_reg_date: '2015-12-24', reco_ID: 101412, City_ID: 1100 },
  { bd_ID: 150013, bd_name: 'Bruce', bd_age: 22, bd_sex: 'M', bd_Bgroup: 'AB+', bd_reg_date: '2015-08-28', reco_ID: 101212, City_ID: 1200 },
  { bd_ID: 150014, bd_name: 'Natasha', bd_age: 29, bd_sex: 'M', bd_Bgroup: 'B+', bd_reg_date: '2015-12-17', reco_ID: 101212, City_ID: 1300 },
  { bd_ID: 150015, bd_name: 'Hermoine', bd_age: 42, bd_sex: 'M', bd_Bgroup: 'A+', bd_reg_date: '2016-11-22', reco_ID: 101212, City_ID: 1300 },
  { bd_ID: 150016, bd_name: 'Harry', bd_age: 44, bd_sex: 'F', bd_Bgroup: 'AB-', bd_reg_date: '2016-02-06', reco_ID: 101212, City_ID: 1200 },
  { bd_ID: 150017, bd_name: 'Sherlock', bd_age: 33, bd_sex: 'M', bd_Bgroup: 'B-', bd_reg_date: '2016-10-15', reco_ID: 101312, City_ID: 1400 },
  { bd_ID: 150018, bd_name: 'Logan', bd_age: 31, bd_sex: 'F', bd_Bgroup: 'O+', bd_reg_date: '2016-01-04', reco_ID: 101312, City_ID: 1200 },
  { bd_ID: 150019, bd_name: 'Peter', bd_age: 24, bd_sex: 'F', bd_Bgroup: 'AB+', bd_reg_date: '2016-09-10', reco_ID: 101312, City_ID: 1500 },
  { bd_ID: 150020, bd_name: 'Odinson', bd_age: 29, bd_sex: 'M', bd_Bgroup: 'O-', bd_reg_date: '2016-12-17', reco_ID: 101212, City_ID: 1200 },
];

export const diseaseFinders: DiseaseFinder[] = [
  { dfind_ID: 11, dfind_name: 'Indiana', dfind_PhNo: 9693959681 },
  { dfind_ID: 12, dfind_name: 'Stephen', dfind_PhNo: 9693959682 },
  { dfind_ID: 13, dfind_name: 'Christine', dfind_PhNo: 9693959683 },
  { dfind_ID: 14, dfind_name: 'Gwen', dfind_PhNo: 9693959672 },
  { dfind_ID: 15, dfind_name: 'Viktor', dfind_PhNo: 9693959679 },
];

export const bloodSpecimens: BloodSpecimen[] = [
  { specimen_number: 1001, b_group: 'B+', status: 1, dfind_ID: 11, M_id: 101 },
  { specimen_number: 1002, b_group: 'O+', status: 1, dfind_ID: 12, M_id: 102 },
  { specimen_number: 1003, b_group: 'AB+', status: 1, dfind_ID: 11, M_id: 102 },
  { specimen_number: 1004, b_group: 'O-', status: 1, dfind_ID: 13, M_id: 103 },
  { specimen_number: 1005, b_group: 'A+', status: 0, dfind_ID: 14, M_id: 101 },
  { specimen_number: 1006, b_group: 'A-', status: 1, dfind_ID: 13, M_id: 104 },
  { specimen_number: 1007, b_group: 'AB-', status: 1, dfind_ID: 15, M_id: 104 },
  { specimen_number: 1008, b_group: 'AB-', status: 0, dfind_ID: 11, M_id: 105 },
  { specimen_number: 1009, b_group: 'B+', status: 1, dfind_ID: 13, M_id: 105 },
  { specimen_number: 1010, b_group: 'O+', status: 0, dfind_ID: 12, M_id: 105 },
];

export const hospitals: Hospital[] = [
  { hosp_ID: 1, hosp_name: 'Springfield', City_ID: 1100, M_id: 101 },
  { hosp_ID: 2, hosp_name: 'Hampshire', City_ID: 1200, M_id: 103 },
  { hosp_ID: 3, hosp_name: 'Winterfell', City_ID: 1300, M_id: 103 },
  { hosp_ID: 4, hosp_name: 'Riverrun', City_ID: 1400, M_id: 104 },
  { hosp_ID: 5, hosp_name: 'Hogsmeade', City_ID: 1800, M_id: 103 },
];

export const hospitalNeeds: HospitalNeed[] = [
  { hosp_ID: 1, hosp_name: 'Springfield', hosp_needed_Bgrp: 'A+', hosp_needed_qnty: 20 },
  { hosp_ID: 1, hosp_name: 'Springfield', hosp_needed_Bgrp: 'AB+', hosp_needed_qnty: 40 },
  { hosp_ID: 1, hosp_name: 'Springfield', hosp_needed_Bgrp: 'AB-', hosp_needed_qnty: 10 },
  { hosp_ID: 1, hosp_name: 'Springfield', hosp_needed_Bgrp: 'B-', hosp_needed_qnty: 20 },
  { hosp_ID: 2, hosp_name: 'Hampshire', hosp_needed_Bgrp: 'A+', hosp_needed_qnty: 40 },
  { hosp_ID: 2, hosp_name: 'Hampshire', hosp_needed_Bgrp: 'AB+', hosp_needed_qnty: 20 },
  { hosp_ID: 2, hosp_name: 'Hampshire', hosp_needed_Bgrp: 'B-', hosp_needed_qnty: 30 },
  { hosp_ID: 3, hosp_name: 'Winterfell', hosp_needed_Bgrp: 'B-', hosp_needed_qnty: 20 },
  { hosp_ID: 3, hosp_name: 'Winterfell', hosp_needed_Bgrp: 'B+', hosp_needed_qnty: 10 },
  { hosp_ID: 4, hosp_name: 'Riverrun', hosp_needed_Bgrp: 'A+', hosp_needed_qnty: 10 },
  { hosp_ID: 4, hosp_name: 'Riverrun', hosp_needed_Bgrp: 'A-', hosp_needed_qnty: 40 },
];

export const recipients: Recipient[] = [
  { reci_ID: 10001, reci_name: 'Indiana', reci_age: 25, reci_Brgp: 'B+', reci_Bqnty: 1.5, reco_ID: 101212, City_ID: 1100, M_id: 101, reci_sex: 'F', reci_reg_date: '2015-12-17' },
  { reci_ID: 10002, reci_name: 'Bruce', reci_age: 60, reci_Brgp: 'A+', reci_Bqnty: 1, reco_ID: 101312, City_ID: 1100, M_id: 102, reci_sex: 'M', reci_reg_date: '2015-12-16' },
  { reci_ID: 10003, reci_name: 'Goku', reci_age: 35, reci_Brgp: 'AB+', reci_Bqnty: 0.5, reco_ID: 101312, City_ID: 1200, M_id: 102, reci_sex: 'M', reci_reg_date: '2015-10-17' },
  { reci_ID: 10004, reci_name: 'Stephen', reci_age: 66, reci_Brgp: 'B+', reci_Bqnty: 1, reco_ID: 101212, City_ID: 1300, M_id: 104, reci_sex: 'M', reci_reg_date: '2016-11-17' },
  { reci_ID: 10005, reci_name: 'Itachi', reci_age: 53, reci_Brgp: 'B-', reci_Bqnty: 1, reco_ID: 101412, City_ID: 1400, M_id: 105, reci_sex: 'M', reci_reg_date: '2015-04-17' },
  { reci_ID: 10006, reci_name: 'Erwin', reci_age: 45, reci_Brgp: 'O+', reci_Bqnty: 1.5, reco_ID: 101512, City_ID: 1500, M_id: 105, reci_sex: 'M', reci_reg_date: '2015-12-17' },
  { reci_ID: 10007, reci_name: 'Natasha', reci_age: 22, reci_Brgp: 'AB-', reci_Bqnty: 1, reco_ID: 101212, City_ID: 1500, M_id: 101, reci_sex: 'M', reci_reg_date: '2015-05-17' },
  { reci_ID: 10008, reci_name: 'Julius', reci_age: 25, reci_Brgp: 'B+', reci_Bqnty: 2, reco_ID: 101412, City_ID: 1300, M_id: 103, reci_sex: 'F', reci_reg_date: '2015-12-14' },
  { reci_ID: 10009, reci_name: 'Hemsworth', reci_age: 30, reci_Brgp: 'A+', reci_Bqnty: 1.5, reco_ID: 101312, City_ID: 1100, M_id: 104, reci_sex: 'M', reci_reg_date: '2015-02-16' },
  { reci_ID: 10010, reci_name: 'Langford', reci_age: 25, reci_Brgp: 'AB+', reci_Bqnty: 3.5, reco_ID: 101212, City_ID: 1200, M_id: 107, reci_sex: 'F', reci_reg_date: '2016-10-17' },
];
