<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>{{ $config['pdf']['title'] }} - {{ $apv->reference_number }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 9px;
            line-height: 1.2;
            color: #333;
        }

        .container {
            padding: 10px 15px;
        }

        /* Header */
        .header {
            border-bottom: 2px solid #333;
            padding-bottom: 8px;
            margin-bottom: 10px;
        }

        .header-content {
            width: 100%;
        }

        .company-info {
            text-align: center;
        }

        .company-name {
            font-size: 14px;
            font-weight: bold;
            color: #1a1a1a;
            margin-bottom: 2px;
        }

        .company-details {
            font-size: 8px;
            color: #666;
        }

        .document-title {
            text-align: center;
            margin-top: 8px;
        }

        .document-title h1 {
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        /* Reference Info */
        .reference-box {
            background-color: #f5f5f5;
            border: 1px solid #ddd;
            padding: 6px;
            margin-bottom: 10px;
        }

        .reference-table {
            width: 100%;
        }

        .reference-table td {
            padding: 2px 0;
        }

        .reference-table .label {
            font-weight: bold;
            width: 120px;
            color: #555;
        }

        .reference-number {
            font-size: 11px;
            font-weight: bold;
            color: #1a1a1a;
        }

        .status-badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 2px;
            font-size: 8px;
            font-weight: bold;
            text-transform: uppercase;
            color: #fff;
        }

        .priority-badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 2px;
            font-size: 8px;
            font-weight: bold;
            text-transform: uppercase;
        }

        .priority-urgent {
            background-color: #EF4444;
            color: #fff;
        }

        .priority-normal {
            background-color: #6B7280;
            color: #fff;
        }

        /* Section */
        .section {
            margin-bottom: 10px;
        }

        .section-title {
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            color: #333;
            border-bottom: 1px solid #ddd;
            padding-bottom: 3px;
            margin-bottom: 5px;
        }

        /* Info Grid */
        .info-grid {
            width: 100%;
        }

        .info-grid td {
            padding: 2px 8px 2px 0;
            vertical-align: top;
        }

        .info-grid .label {
            font-weight: bold;
            color: #555;
            width: 90px;
        }

        .info-grid .value {
            color: #1a1a1a;
        }

        /* Items Table */
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 5px;
        }

        .items-table th {
            background-color: #f5f5f5;
            border: 1px solid #ddd;
            padding: 4px;
            text-align: left;
            font-weight: bold;
            font-size: 8px;
            text-transform: uppercase;
        }

        .items-table td {
            border: 1px solid #ddd;
            padding: 4px;
            vertical-align: top;
        }

        .items-table .text-right {
            text-align: right;
        }

        .items-table .total-row {
            background-color: #f5f5f5;
            font-weight: bold;
        }

        /* Amount */
        .amount {
            font-family: 'DejaVu Sans Mono', monospace;
        }

        .total-amount {
            font-size: 10px;
            font-weight: bold;
        }

        /* Notes */
        .notes-box {
            background-color: #fffdf0;
            border: 1px solid #e5e3d0;
            padding: 5px;
            margin-top: 5px;
        }

        /* Approval Section */
        .approval-section {
            margin-top: 10px;
        }

        .approval-grid {
            width: 100%;
        }

        .approval-grid td {
            padding: 3px;
            vertical-align: top;
            width: 33.33%;
        }

        .approval-box {
            border: 1px solid #ddd;
            padding: 6px;
            text-align: center;
            min-height: 60px;
        }

        .approval-box .title {
            font-weight: bold;
            font-size: 8px;
            text-transform: uppercase;
            color: #555;
            margin-bottom: 4px;
        }

        .approval-box .signature-image {
            max-height: 30px;
            max-width: 100px;
            margin: 4px auto;
        }

        .approval-box .name {
            font-weight: bold;
            margin-top: 4px;
            border-top: 1px solid #333;
            padding-top: 3px;
            font-size: 8px;
        }

        .approval-box .date {
            font-size: 7px;
            color: #666;
            margin-top: 2px;
        }

        /* Footer */
        .footer {
            position: fixed;
            bottom: 10px;
            left: 15px;
            right: 15px;
            text-align: center;
            font-size: 7px;
            color: #999;
            border-top: 1px solid #eee;
            padding-top: 5px;
        }

        .page-number {
            text-align: right;
        }

        /* History Section */
        .history-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8px;
        }

        .history-table th {
            background-color: #f5f5f5;
            border: 1px solid #ddd;
            padding: 4px;
            text-align: left;
            font-weight: bold;
        }

        .history-table td {
            border: 1px solid #ddd;
            padding: 4px;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="header-content">
                <div class="company-info">
                    <div class="company-name">{{ $config['company']['name'] }}</div>
                    <div class="company-details">
                        {{ $config['company']['address'] }}<br>
                        {{ $config['company']['phone'] }} | {{ $config['company']['email'] }}
                    </div>
                </div>
                <div class="document-title">
                    <h1>{{ $config['pdf']['title'] }}</h1>
                </div>
            </div>
        </div>

        <!-- Reference Info -->
        <div class="reference-box">
            <table class="reference-table">
                <tr>
                    <td class="label">Reference Number:</td>
                    <td class="reference-number">{{ $apv->reference_number }}</td>
                    <td class="label" style="text-align: right;">Status:</td>
                    <td style="text-align: right;">
                        <span class="status-badge" style="background-color: {{ $config['statuses'][$apv->status]['color'] }};">
                            {{ $config['statuses'][$apv->status]['label'] }}
                        </span>
                    </td>
                </tr>
                <tr>
                    <td class="label">Date Created:</td>
                    <td>{{ \Carbon\Carbon::parse($apv->created_at)->format($config['date_format']) }}</td>
                    <td class="label" style="text-align: right;">Priority:</td>
                    <td style="text-align: right;">
                        <span class="priority-badge {{ $apv->is_priority ? 'priority-urgent' : 'priority-normal' }}">
                            {{ $apv->is_priority ? 'Urgent' : 'Normal' }}
                        </span>
                    </td>
                </tr>
            </table>
        </div>

        <!-- Voucher Details -->
        <div class="section">
            <div class="section-title">Voucher Details</div>
            <table class="info-grid">
                <tr>
                    <td class="label">Vendor:</td>
                    <td class="value">{{ $apv->vendor_name }}</td>
                    <td class="label">Department:</td>
                    <td class="value">{{ $apv->department }}</td>
                </tr>
                <tr>
                    <td class="label">Particular:</td>
                    <td class="value">{{ $config['particulars'][$apv->particular] ?? $apv->particular }}</td>
                    <td class="label">Expected Date:</td>
                    <td class="value">{{ \Carbon\Carbon::parse($apv->expected_date)->format($config['date_format']) }}</td>
                </tr>
                <tr>
                    <td class="label">Requested By:</td>
                    <td class="value" colspan="3">{{ $apv->requester->name ?? 'N/A' }}</td>
                </tr>
            </table>

            @if($apv->notes)
            <div class="notes-box">
                <strong>Notes:</strong><br>
                {{ $apv->notes }}
            </div>
            @endif
        </div>

        <!-- Line Items -->
        <div class="section">
            <div class="section-title">Line Items</div>
            <table class="items-table">
                <thead>
                    <tr>
                        <th style="width: 5%;">#</th>
                        <th style="width: 35%;">Description</th>
                        <th style="width: 20%;">Category</th>
                        <th style="width: 10%;" class="text-right">Qty</th>
                        <th style="width: 15%;" class="text-right">Unit Price</th>
                        <th style="width: 15%;" class="text-right">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($apv->particulars as $index => $item)
                    <tr>
                        <td>{{ $index + 1 }}</td>
                        <td>{{ $item->description }}</td>
                        <td>{{ $config['categories'][$item->category] ?? $item->category }}</td>
                        <td class="text-right">{{ $item->quantity }}</td>
                        <td class="text-right amount">{{ $config['currency']['symbol'] }}{{ number_format($item->unit_price, $config['currency']['decimals'], $config['currency']['decimal_separator'], $config['currency']['thousands_separator']) }}</td>
                        <td class="text-right amount">{{ $config['currency']['symbol'] }}{{ number_format($item->amount, $config['currency']['decimals'], $config['currency']['decimal_separator'], $config['currency']['thousands_separator']) }}</td>
                    </tr>
                    @endforeach
                    <tr class="total-row">
                        <td colspan="5" class="text-right">Total Amount:</td>
                        <td class="text-right total-amount amount">{{ $config['currency']['symbol'] }}{{ number_format($apv->total_amount, $config['currency']['decimals'], $config['currency']['decimal_separator'], $config['currency']['thousands_separator']) }}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Approval Signatures -->
        <div class="section approval-section">
            <div class="section-title">Signatures</div>

            <!-- Row 1: Prepared By -->
            @if($config['signatures']['prepared_by']['show'])
            <table class="approval-grid">
                <tr>
                    <td style="width: 33%;">
                        <div class="approval-box">
                            <div class="title">{{ $config['signatures']['prepared_by']['label'] }}</div>
                            @if($apv->requester && $apv->requester->signature_path)
                                <img src="{{ public_path('storage/' . $apv->requester->signature_path) }}" class="signature-image" alt="Signature">
                            @endif
                            <div class="name">{{ $apv->requester->name ?? '________________' }}</div>
                            <div class="date">{{ \Carbon\Carbon::parse($apv->created_at)->format($config['date_format']) }}</div>
                        </div>
                    </td>
                    <td style="width: 67%;"></td>
                </tr>
            </table>
            @endif

            <!-- Row 2: Designated Approvers -->
            @if(isset($designatedApprovers) && $designatedApprovers->count() > 0)
            <table class="approval-grid" style="margin-top: 5px;">
                <tr>
                    @foreach($designatedApprovers as $designatedApprover)
                    <td style="width: {{ 100 / $designatedApprovers->count() }}%;">
                        <div class="approval-box">
                            <div class="title">{{ $designatedApprover->title ?? 'Approved By' }}</div>
                            @php
                                $isActualApprover = $apv->approver && $apv->approved_by == $designatedApprover->user_id;
                            @endphp
                            @if($designatedApprover->user->signature_path)
                                @if($isActualApprover)
                                    <img src="{{ public_path('storage/' . $designatedApprover->user->signature_path) }}" class="signature-image" alt="Signature">
                                @endif
                            @endif
                            <div class="name">{{ $designatedApprover->user->name }}</div>
                            @if($isActualApprover && $apv->approved_at)
                                <div class="date">{{ \Carbon\Carbon::parse($apv->approved_at)->format($config['date_format']) }}</div>
                            @else
                                <div class="date">&nbsp;</div>
                            @endif
                        </div>
                    </td>
                    @endforeach
                </tr>
            </table>
            @elseif($config['signatures']['approved_by']['show'])
            <!-- Fallback to original approved_by if no designated approvers -->
            <table class="approval-grid" style="margin-top: 5px;">
                <tr>
                    <td style="width: 33%;">
                        <div class="approval-box">
                            <div class="title">{{ $config['signatures']['approved_by']['label'] }}</div>
                            @if($apv->approver)
                                @if($apv->approver->signature_path)
                                    <img src="{{ public_path('storage/' . $apv->approver->signature_path) }}" class="signature-image" alt="Signature">
                                @endif
                                <div class="name">{{ $apv->approver->name }}</div>
                                <div class="date">{{ $apv->approved_at ? \Carbon\Carbon::parse($apv->approved_at)->format($config['date_format']) : '' }}</div>
                            @else
                                <div class="name">________________</div>
                                <div class="date">&nbsp;</div>
                            @endif
                        </div>
                    </td>
                    <td style="width: 67%;"></td>
                </tr>
            </table>
            @endif

            <!-- Row 3: Designated Releasers -->
            @if(isset($designatedReleasers) && $designatedReleasers->count() > 0)
            <table class="approval-grid" style="margin-top: 5px;">
                <tr>
                    @foreach($designatedReleasers as $designatedReleaser)
                    <td style="width: {{ 100 / $designatedReleasers->count() }}%;">
                        <div class="approval-box">
                            <div class="title">{{ $designatedReleaser->title ?? 'Released By' }}</div>
                            @php
                                $isActualReleaser = $apv->releasedBy && $apv->released_by == $designatedReleaser->user_id;
                            @endphp
                            @if($designatedReleaser->user->signature_path)
                                @if($isActualReleaser)
                                    <img src="{{ public_path('storage/' . $designatedReleaser->user->signature_path) }}" class="signature-image" alt="Signature">
                                @endif
                            @endif
                            <div class="name">{{ $designatedReleaser->user->name }}</div>
                            @if($isActualReleaser && $apv->released_at)
                                <div class="date">{{ \Carbon\Carbon::parse($apv->released_at)->format($config['date_format']) }}</div>
                            @else
                                <div class="date">&nbsp;</div>
                            @endif
                        </div>
                    </td>
                    @endforeach
                </tr>
            </table>
            @elseif($config['signatures']['released_by']['show'])
            <!-- Fallback to original released_by if no designated releasers -->
            <table class="approval-grid" style="margin-top: 5px;">
                <tr>
                    <td style="width: 33%;">
                        <div class="approval-box">
                            <div class="title">{{ $config['signatures']['released_by']['label'] }}</div>
                            @if($apv->releasedBy)
                                @if($apv->releasedBy->signature_path)
                                    <img src="{{ public_path('storage/' . $apv->releasedBy->signature_path) }}" class="signature-image" alt="Signature">
                                @endif
                                <div class="name">{{ $apv->releasedBy->name }}</div>
                                <div class="date">{{ $apv->released_at ? \Carbon\Carbon::parse($apv->released_at)->format($config['date_format']) : '' }}</div>
                            @else
                                <div class="name">________________</div>
                                <div class="date">&nbsp;</div>
                            @endif
                        </div>
                    </td>
                    <td style="width: 67%;"></td>
                </tr>
            </table>
            @endif
        </div>

        <!-- Rejection Reason -->
        @if($apv->status === 'rejected' && $apv->rejected_reason)
        <div class="section">
            <div class="section-title" style="color: #EF4444;">Rejection Reason</div>
            <div class="notes-box" style="background-color: #FEF2F2; border-color: #FECACA;">
                {{ $apv->rejected_reason }}
            </div>
        </div>
        @endif

        <!-- Footer -->
        @if($config['pdf']['show_footer'])
        <div class="footer">
            {{ $config['pdf']['footer_text'] }}<br>
            Generated on {{ now()->format($config['datetime_format']) }}
        </div>
        @endif
    </div>
</body>
</html>
