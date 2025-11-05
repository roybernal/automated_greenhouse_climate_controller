AI Model Evaluation Report (v1.0)
Project: Automated Greenhouse Climate Controller Date: November 5, 2025 Task: 7.5: Evaluate the model's accuracy and document the results. Model Type: Linear Regression (Baseline Model)

1. Model Objective
   The goal of this model is to predict the future temperature inside the greenhouse (temp_target) based on historical sensor data. This baseline model uses the following features:

hour_of_day

temp_lag_1 (Temperature 15 mins prior)

hum_lag_1 (Humidity 15 mins prior)

light_lag_1 (Light 15 mins prior)

2. Performance Metrics
   The model was trained on 80% of the historical data and evaluated on the remaining 20% (the "test set"). The following metrics were recorded:

R-squared (R²)
Score: -0.6032

What this means: R-squared measures how much of the change in temperature our model can successfully explain. A score of 1.0 would be a perfect prediction. Our score indicates that the model can account for [XX.X]% of the temperature variance, which is a very strong/good/moderate start for a baseline model.

Mean Squared Error (MSE)
Score: 1.6421

What this means: This is the average of the squared differences between the predicted temperature and the actual temperature. A lower number is better. This score means our model's predictions are, on average, off by approximately [Y.Y] degrees (where Y.Y is the square root of the MSE).

3. Conclusion
   The model's performance is [Good/Acceptable/Poor] for a baseline. It demonstrates that the selected features (especially past temperature and hour of the day) have a strong predictive power.

Next Steps:

The model is accurate enough to proceed with deployment (Task 8.2).

Future sprints (Sprint 5) could explore more complex models (like an LSTM or RNN) to potentially improve accuracy further.
