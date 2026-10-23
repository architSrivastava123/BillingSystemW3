function calculateBill(startTimeMs, endTimeMs, firstHourPrice, additionalHourPrice) {

  const durationMs = Math.max(0, endTimeMs - startTimeMs);


  const totalSeconds = Math.floor(durationMs / 1000);
  const totalMinutes = Math.ceil(durationMs / (1000 * 60));
  const billedHours = Math.max(1, Math.ceil(totalMinutes / 60));
  const firstHourCharge = firstHourPrice;

  const additionalHours = billedHours - 1;
  const additionalHoursCharge = additionalHours * additionalHourPrice;

  const totalAmount = firstHourCharge + additionalHoursCharge;

  return {
    durationMs,
    totalSeconds,
    totalMinutes,
    billedHours,
    firstHourCharge,
    additionalHours,
    additionalHoursCharge,
    totalAmount
  };
}

module.exports = {
  calculateBill
};
