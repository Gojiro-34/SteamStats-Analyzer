// ===== All Python analysis scripts as template literals =====

export const cleanDataScript = `
import pandas as pd
import json

df = pd.read_json(csv_json)

# Select only the columns we need
cols = ['name', 'price_usd', 'categories', 'recommendations', 'positive_reviews', 'avg_playtime_forever']
df = df[[c for c in cols if c in df.columns]]

# Extract primary category from categories (first tag)
df['primary_category'] = df['categories'].apply(
    lambda x: str(x).split(',')[0].strip() if pd.notna(x) and str(x).strip() != '' else 'Unknown'
)

# Clean data: drop rows where avg_playtime_forever == 0 or price_usd is null
df = df[df['avg_playtime_forever'] != 0]
df = df.dropna(subset=['price_usd'])
df = df[df['price_usd'] >= 0]

# Calculate recommendation percentage
df['rec_pct'] = df.apply(
    lambda r: round((r['positive_reviews'] / (r['positive_reviews'] + (r['recommendations'] - r['positive_reviews']))) * 100, 1) 
    if r['recommendations'] > 0 and pd.notna(r['positive_reviews']) else 0, axis=1
)

clean_json = df.to_json(orient='records')
clean_json
`;

export const dashboardScript = `
import pandas as pd
import json
import numpy as np

df = pd.read_json(clean_data_json)

total_games = len(df)
avg_price = round(float(df['price_usd'].mean()), 2)
avg_playtime = round(float(df['avg_playtime_forever'].mean()), 1)
avg_recs = round(float(df['recommendations'].mean()), 0)

# Top 10 games by avg playtime
top10 = df.nlargest(10, 'avg_playtime_forever')[['name', 'avg_playtime_forever']].to_dict('records')

# Game count by category (top 8 + Other)
cat_counts = df['primary_category'].value_counts()
top8_cats = cat_counts.head(8)
other_count = cat_counts.iloc[8:].sum() if len(cat_counts) > 8 else 0
cat_data = top8_cats.to_dict()
if other_count > 0:
    cat_data['Other'] = int(other_count)

result = {
    'total_games': int(total_games),
    'avg_price': avg_price,
    'avg_playtime': avg_playtime,
    'avg_recs': int(avg_recs),
    'top10_playtime': top10,
    'category_counts': cat_data
}

json.dumps(result)
`;

export const descriptiveScript = `
import pandas as pd
import numpy as np
import json
from scipy import stats as sp_stats

df = pd.read_json(clean_data_json)

# Apply category filter if provided
try:
    cat = str(filter_category).strip()
    if cat and cat != '' and cat != 'None':
        filtered = df[df['primary_category'] == cat]
        if len(filtered) >= 2:
            df = filtered
except:
    pass

variables = {
    'Price ($)': df['price_usd'],
    'Reviews': df['recommendations'],
    'Avg Playtime (mins)': df['avg_playtime_forever']
}

table_data = {}
ci_data = {}

for name, series in variables.items():
    s = series.dropna()
    n = len(s)
    if n < 2:
        continue
    mean_val = float(s.mean())
    std_val = float(s.std())
    
    try:
        mode_result = sp_stats.mode(s, keepdims=True)
        mode_val = float(mode_result.mode[0]) if len(mode_result.mode) > 0 else mean_val
    except:
        mode_val = mean_val
    
    q1 = float(np.percentile(s, 25))
    q3 = float(np.percentile(s, 75))
    iqr = q3 - q1
    
    # 95% CI
    try:
        se = std_val / np.sqrt(n) if n > 0 else 0
        ci = sp_stats.t.interval(0.95, df=max(n-1, 1), loc=mean_val, scale=max(se, 1e-10))
    except:
        ci = (mean_val, mean_val)
    
    try:
        skew_val = round(float(s.skew()), 4)
    except:
        skew_val = 0
    try:
        kurt_val = round(float(s.kurtosis()), 4)
    except:
        kurt_val = 0
    
    table_data[name] = {
        'Mean': round(mean_val, 2),
        'Median': round(float(s.median()), 2),
        'Mode': round(mode_val, 2),
        'Std Dev': round(std_val, 2),
        'Variance': round(float(s.var()), 2),
        'Min': round(float(s.min()), 2),
        'Max': round(float(s.max()), 2),
        'Q1': round(q1, 2),
        'Q3': round(q3, 2),
        'IQR': round(iqr, 2),
        'Skewness': skew_val,
        'Kurtosis': kurt_val
    }
    
    ci_data[name] = {
        'lower': round(ci[0], 2),
        'upper': round(ci[1], 2),
        'mean': round(mean_val, 2)
    }

# Histogram data
def make_hist(series, bins=20):
    s = series.dropna()
    if len(s) < 2:
        return {'labels': [], 'counts': []}
    actual_bins = min(bins, len(s.unique()))
    if actual_bins < 2:
        actual_bins = 2
    counts, edges = np.histogram(s, bins=actual_bins)
    labels = [f"{round(edges[i],1)}-{round(edges[i+1],1)}" for i in range(len(counts))]
    return {'labels': labels, 'counts': counts.tolist()}

hist_price = make_hist(df['price_usd'], 20)
hist_reviews = make_hist(df['recommendations'], 20)
hist_playtime = make_hist(df['avg_playtime_forever'], 20)

result = {
    'table': table_data,
    'ci': ci_data,
    'histograms': {
        'price': hist_price,
        'reviews': hist_reviews,
        'playtime': hist_playtime
    }
}

json.dumps(result)
`;

export const boxPlotScript = `
import pandas as pd
import numpy as np
import json

df = pd.read_json(clean_data_json)

# Apply category filter if provided
try:
    cat = str(filter_category).strip()
    if cat and cat != '' and cat != 'None':
        filtered = df[df['primary_category'] == cat]
        if len(filtered) >= 2:
            df = filtered
except:
    pass

# Get top 6 categories by count
top_cats = df['primary_category'].value_counts().head(6).index.tolist()

box_data = {}
for cat in top_cats:
    vals = df[df['primary_category'] == cat]['avg_playtime_forever'].dropna()
    if len(vals) >= 5:
        sorted_vals = sorted(vals.tolist())
        # Cap at 800 values for performance
        if len(sorted_vals) > 800:
            step = len(sorted_vals) / 800
            sorted_vals = [sorted_vals[int(i * step)] for i in range(800)]
        box_data[cat] = sorted_vals

json.dumps(box_data)
`;

export const probabilityScript = `
import pandas as pd
import numpy as np
import json
from scipy import stats as sp_stats

df = pd.read_json(clean_data_json)

playtime = df['avg_playtime_forever'].dropna().values
price = df['price_usd'].dropna().values
recs = df['recommendations'].dropna().values

# Fit normal distribution to playtime
mu, sigma = sp_stats.norm.fit(playtime)

# Probability calculations
p_playtime_gt_1000 = 1 - sp_stats.norm.cdf(1000, mu, sigma)

mu_price, sigma_price = sp_stats.norm.fit(price)
p_price_lt_5 = sp_stats.norm.cdf(5, mu_price, sigma_price)

mu_recs, sigma_recs = sp_stats.norm.fit(recs)
p_recs_gt_10000 = 1 - sp_stats.norm.cdf(10000, mu_recs, sigma_recs)

result = {
    'mu': round(float(mu), 2),
    'sigma': round(float(sigma), 2),
    'probabilities': {
        'p_playtime_gt_1000': round(float(p_playtime_gt_1000), 6),
        'p_price_lt_5': round(float(p_price_lt_5), 6),
        'p_recs_gt_10000': round(float(p_recs_gt_10000), 6)
    }
}

json.dumps(result)
`;

export const normalCalcScript = `
import json
from scipy import stats as sp_stats

mu_val = float(calc_mu)
sigma_val = float(calc_sigma)
x_val = float(calc_x)

p_less = float(sp_stats.norm.cdf(x_val, mu_val, sigma_val))
p_greater = 1.0 - p_less

result = {
    'p_less': round(p_less, 8),
    'p_greater': round(p_greater, 8),
    'x': x_val,
    'mu': mu_val,
    'sigma': sigma_val
}

json.dumps(result)
`;

export const regressionScript = `
import pandas as pd
import numpy as np
import json
from sklearn.linear_model import LinearRegression

df = pd.read_json(clean_data_json)

# Simple regression: Price -> Playtime
X_simple = df[['price_usd']].values
y = df['avg_playtime_forever'].values

model_simple = LinearRegression()
model_simple.fit(X_simple, y)

y_pred_simple = model_simple.predict(X_simple)
r2_simple = float(model_simple.score(X_simple, y))
rmse_simple = float(np.sqrt(np.mean((y - y_pred_simple)**2)))
coef_simple = float(model_simple.coef_[0])
intercept_simple = float(model_simple.intercept_)

# Scatter data for chart (sample 300 points for performance)
n = len(df)
sample_idx = np.random.choice(n, min(300, n), replace=False)
scatter_x = df['price_usd'].values[sample_idx].tolist()
scatter_y = df['avg_playtime_forever'].values[sample_idx].tolist()

# Regression line points
line_x = [float(df['price_usd'].min()), float(df['price_usd'].max())]
line_y = [coef_simple * line_x[0] + intercept_simple, coef_simple * line_x[1] + intercept_simple]

# Multiple regression: Price + Reviews -> Playtime
X_multi = df[['price_usd', 'recommendations']].values
model_multi = LinearRegression()
model_multi.fit(X_multi, y)

y_pred_multi = model_multi.predict(X_multi)
r2_multi = float(model_multi.score(X_multi, y))
rmse_multi = float(np.sqrt(np.mean((y - y_pred_multi)**2)))

result = {
    'simple': {
        'coef': round(coef_simple, 4),
        'intercept': round(intercept_simple, 4),
        'r2': round(r2_simple, 6),
        'rmse': round(rmse_simple, 2),
        'scatter_x': scatter_x,
        'scatter_y': scatter_y,
        'line_x': line_x,
        'line_y': line_y
    },
    'multiple': {
        'coefs': {
            'price_usd': round(float(model_multi.coef_[0]), 4),
            'recommendations': round(float(model_multi.coef_[1]), 4)
        },
        'intercept': round(float(model_multi.intercept_), 4),
        'r2': round(r2_multi, 6),
        'rmse': round(rmse_multi, 2)
    }
}

json.dumps(result)
`;

export const predictScript = `
import pandas as pd
import numpy as np
import json
from sklearn.linear_model import LinearRegression

df = pd.read_json(clean_data_json)

X = df[['price_usd', 'recommendations']].values
y = df['avg_playtime_forever'].values

model = LinearRegression()
model.fit(X, y)

pred = model.predict([[float(input_price), float(input_reviews)]])
result = {'predicted_playtime': round(float(pred[0]), 2)}
json.dumps(result)
`;

export const correlationScript = `
import pandas as pd
import numpy as np
import json
from scipy import stats as sp_stats

df = pd.read_json(clean_data_json)

cols = ['price_usd', 'recommendations', 'avg_playtime_forever']
labels = ['Price', 'Reviews', 'Playtime']

corr = df[cols].corr(method='pearson')

# Calculate p-values
pval_matrix = []
for i in range(len(cols)):
    row = []
    for j in range(len(cols)):
        if i == j:
            row.append(0.0)
        else:
            r, p = sp_stats.pearsonr(df[cols[i]].dropna(), df[cols[j]].dropna())
            row.append(round(float(p), 6))
    pval_matrix.append(row)

matrix = []
for i, row_label in enumerate(labels):
    row = []
    for j, col_label in enumerate(labels):
        row.append(round(float(corr.iloc[i, j]), 4))
    matrix.append(row)

result = {
    'labels': labels,
    'matrix': matrix,
    'pvalues': pval_matrix
}

json.dumps(result)
`;

export const explorerDataScript = `
import pandas as pd
import json

df = pd.read_json(clean_data_json)

categories = sorted(df['primary_category'].unique().tolist())
max_price = float(df['price_usd'].max())

result = {
    'categories': categories,
    'max_price': round(max_price, 2),
    'total_rows': len(df)
}

json.dumps(result)
`;

export const outlierScript = `
import pandas as pd
import numpy as np
import json

df = pd.read_json(clean_data_json)

col_key = str(outlier_column).strip()
col_map = {
    'price_usd': 'Price ($)',
    'recommendations': 'Reviews',
    'avg_playtime_forever': 'Avg Playtime (mins)'
}

col_label = col_map.get(col_key, col_key)
series = df[col_key].dropna()

q1 = float(np.percentile(series, 25))
q3 = float(np.percentile(series, 75))
iqr = q3 - q1
lower = q1 - 1.5 * iqr
upper = q3 + 1.5 * iqr

outlier_mask = (df[col_key] < lower) | (df[col_key] > upper)
outlier_df = df[outlier_mask].copy()
outlier_df['outlier_value'] = outlier_df[col_key]
outlier_df['direction'] = outlier_df[col_key].apply(lambda v: 'high' if v > upper else 'low')
outlier_df['deviation'] = outlier_df[col_key].apply(
    lambda v: round(abs(v - upper) / iqr, 2) if v > upper else round(abs(lower - v) / iqr, 2)
)

# Sort by deviation descending
outlier_df = outlier_df.sort_values('deviation', ascending=False)

outliers = outlier_df[['name', 'price_usd', 'primary_category', 'recommendations', 'rec_pct', 'avg_playtime_forever', 'outlier_value', 'direction', 'deviation']].head(100).to_dict('records')

result = {
    'column': col_key,
    'column_label': col_label,
    'q1': round(q1, 2),
    'q3': round(q3, 2),
    'iqr': round(iqr, 2),
    'lower_fence': round(lower, 2),
    'upper_fence': round(upper, 2),
    'total_games': len(df),
    'outlier_count': int(outlier_mask.sum()),
    'outlier_pct': round(float(outlier_mask.sum()) / len(df) * 100, 1),
    'outliers': outliers
}

json.dumps(result)
`;
